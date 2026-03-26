"""
GSFC LIMS — Custom password validators (Section 2.2).

Requires at least one uppercase letter and one digit beyond
Django's built-in validators.
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class UppercaseAndDigitValidator:
    """
    Validates that a password contains at least one uppercase letter
    and at least one digit.
    """

    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password must contain at least one uppercase letter (A-Z)."),
                code='password_no_uppercase',
            )
        if not re.search(r'[0-9]', password):
            raise ValidationError(
                _("Password must contain at least one digit (0-9)."),
                code='password_no_digit',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least one uppercase letter and one digit."
        )
