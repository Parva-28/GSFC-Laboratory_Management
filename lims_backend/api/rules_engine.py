import json
import os

class RuleEngine:
    # A generic fallback if specific product rule is not defined or config file is missing
    DEFAULT_RULES = {
        "Urea": {"MIN_MOISTURE": 0.0, "MAX_MOISTURE": 1.0, "MIN_PURITY": 98.0},
        "DAP":  {"MIN_MOISTURE": 0.0, "MAX_MOISTURE": 1.5, "MIN_PURITY": 90.0},
        "NPK":  {"MIN_MOISTURE": 0.0, "MAX_MOISTURE": 1.5, "MIN_PURITY": 85.0},
        "Ammonia": {"MIN_MOISTURE": 0.0, "MAX_MOISTURE": 0.5, "MIN_PURITY": 99.5},
    }

    @classmethod
    def _load_config(cls):
        config_path = os.path.join(os.getcwd(), 'lab_rules_config.json')
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Failed to load user config rules, falling back to defaults. Error: {e}")
        return cls.DEFAULT_RULES

    @classmethod
    def evaluate_rules(cls, product, **kwargs):
        """
        Returns: is_violation (bool), score (int), reason (str), severity (str)
        """
        rules = cls._load_config()
        # Generic limits fallback if exact product matches
        prod_rules = rules.get(product, {"MIN_MOISTURE": 0.0, "MAX_MOISTURE": 2.0, "MIN_PURITY": 80.0})
        
        reasons = []
        score = 0
        severity = "LOW"
        is_violation = False

        # --- Standard Purity & Moisture Analysis ---
        if "moisture" in kwargs and kwargs["moisture"] is not None:
            try:
                moisture = float(kwargs["moisture"])
                min_m = prod_rules.get("MIN_MOISTURE", 0.0)
                max_m = prod_rules.get("MAX_MOISTURE", 2.0)
                if not (min_m <= moisture <= max_m):
                    is_violation = True
                    reasons.append(f"Moisture {moisture}% out of bounds min {min_m}%-max {max_m}%")
                    score += 40
                    severity = "HIGH"
            except (ValueError, TypeError):
                pass
                
        if "purity" in kwargs and kwargs["purity"] is not None:
            try:
                purity = float(kwargs["purity"])
                min_p = prod_rules.get("MIN_PURITY", 80.0)
                if purity < min_p:
                    is_violation = True
                    reasons.append(f"Purity {purity}% below min {min_p}%")
                    score += 40
                    severity = "HIGH"
            except (ValueError, TypeError):
                pass

        # --- Custom Grade Validation for Nylon-6 / Acid ---
        if product == "Nylon-6" and "grade" in kwargs:
            grade = str(kwargs.get("grade", "")).strip().upper()
            rv = float(kwargs.get("rv", 0) or 0)
            h2o = float(kwargs.get("moisture", 0) or 0) # Use moisture param
            
            # E-24 limits
            if grade == "E-24":
                if not (2.40 <= rv <= 2.60):
                    is_violation = True
                    reasons.append(f"RV {rv} out of bounds min 2.40-max 2.60")
                if h2o > 0.10:
                    is_violation = True
                    reasons.append(f"Moisture {h2o}% exceeds max 0.10%")
            # E-26 limits
            elif grade == "E-26":
                if not (2.55 <= rv <= 2.70):
                    is_violation = True
                    reasons.append(f"RV {rv} out of bounds min 2.55-max 2.70")
                if h2o > 0.10:
                    is_violation = True
                    reasons.append(f"Moisture {h2o}% exceeds max 0.10%")
            # E-28 limits
            elif grade == "E-28":
                if not (2.65 <= rv <= 3.00):
                    is_violation = True
                    reasons.append(f"RV {rv} out of bounds min 2.65-max 3.00")
                if h2o > 0.08:
                    is_violation = True
                    reasons.append(f"Moisture {h2o}% exceeds max 0.08%")
            # E-35 limits
            elif grade == "E-35":
                if not (3.00 <= rv <= 3.65):
                    is_violation = True
                    reasons.append(f"RV {rv} out of bounds min 3.00-max 3.65")
                if h2o > 0.08:
                    is_violation = True
                    reasons.append(f"Moisture {h2o}% exceeds max 0.08%")
            # E-50 limits
            elif grade == "E-50":
                if not (4.50 <= rv <= 5.00):
                    is_violation = True
                    reasons.append(f"RV {rv} out of bounds min 4.50-max 5.00")
                if h2o > 0.10:
                    is_violation = True
                    reasons.append(f"Moisture {h2o}% exceeds max 0.10%")

            if is_violation and severity != "HIGH":
                score += 40
                severity = "HIGH"

        # --- Acid (SA III / SA IV) Checks ---
        if product in ["SA III", "SA IV"]:
            pct_h2so4 = float(kwargs.get("pct_h2so4_product", kwargs.get("pct_h2so4", 0)) or 0)
            fe_ppm = float(kwargs.get("fe_ppm", 0) or 0)
            
            if pct_h2so4 > 0 and pct_h2so4 < 98.0:
                is_violation = True
                reasons.append(f"H2SO4 {pct_h2so4}% below min 98.0%")
                score += 40
                severity = "HIGH"
                
            if fe_ppm > 50.0:  # Common threshold for Fe impurity
                is_violation = True
                reasons.append(f"Fe {fe_ppm}ppm exceeds max 50.0ppm")
                score += 40
                severity = "HIGH"

        return is_violation, min(score, 100), " | ".join(reasons), severity
