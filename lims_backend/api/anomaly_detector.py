import statistics
from django.core.cache import cache
from .models import LabData

class StatisticalDetector:
    HISTORICAL_RECORDS_COUNT = 100  # Number of last valid records to build baseline
    Z_SCORE_THRESHOLD = 2.5         # Outlier cutoff

    @classmethod
    def get_baseline(cls, product):
        """Fetches baseline mean and std dev from cache or calculates from DB."""
        cache_key = f"anomaly_baseline_{product.replace(' ', '_')}"
        baseline = cache.get(cache_key)
        if baseline:
            return baseline

        # Calculate from DB
        recent_records = LabData.objects.filter(
            product=product
        ).exclude(
            moisture__isnull=True
        ).exclude(
            purity__isnull=True
        ).order_by('-id')[:cls.HISTORICAL_RECORDS_COUNT]

        if len(recent_records) < 5:
            return None

        moisture_vals = [r.moisture for r in recent_records]
        purity_vals = [r.purity for r in recent_records]

        mean_m = statistics.mean(moisture_vals)
        std_m = statistics.stdev(moisture_vals) if len(moisture_vals) > 1 else 0.0
        
        mean_p = statistics.mean(purity_vals)
        std_p = statistics.stdev(purity_vals) if len(purity_vals) > 1 else 0.0

        baseline = (mean_m, std_m, mean_p, std_p)
        cache.set(cache_key, baseline, timeout=86400) # Cache for 24 hours (invalidated on new saves)
        return baseline
        
    @classmethod
    def invalidate_cache(cls, product):
        """Invalidates the statistical baseline cache for a product."""
        cache_key = f"anomaly_baseline_{product.replace(' ', '_')}"
        cache.delete(cache_key)

    @classmethod
    def detect_anomalies(cls, product, current_moisture, current_purity):
        """
        Calculates z-score of current input against last N records of the same product.
        Returns: is_anomaly (bool), score (int), reason (str), severity (str)
        """
        try:
            current_moisture = float(current_moisture)
        except (ValueError, TypeError):
            return False, 0, "", "LOW"
            
        try:
            current_purity = float(current_purity)
        except (ValueError, TypeError):
            return False, 0, "", "LOW"

        try:
            baseline = cls.get_baseline(product)
            if not baseline:
                return False, 0, "", "LOW"

            mean_m, std_m, mean_p, std_p = baseline

            # Prevent div by zero if standard deviation is 0
            z_m = 0
            if std_m > 0:
                z_m = abs((current_moisture - mean_m) / std_m)
                
            z_p = 0
            if std_p > 0:
                z_p = abs((current_purity - mean_p) / std_p)

            is_anomaly = False
            reasons = []
            score = 0
            severity = "MEDIUM"

            if z_m > cls.Z_SCORE_THRESHOLD:
                is_anomaly = True
                reasons.append(f"Statistical anomaly: moisture deviates from {product} mean by {round(z_m, 1)}σ")
                score += min(int((z_m / cls.Z_SCORE_THRESHOLD) * 40), 50)
                
            if z_p > cls.Z_SCORE_THRESHOLD:
                is_anomaly = True
                reasons.append(f"Statistical anomaly: purity deviates from {product} mean by {round(z_p, 1)}σ")
                score += min(int((z_p / cls.Z_SCORE_THRESHOLD) * 40), 50)

            return is_anomaly, min(score, 100), " | ".join(reasons), severity

        except Exception as e:
            print(f"Error executing statistical anomaly check: {e}")
            return False, 0, "", "LOW"
