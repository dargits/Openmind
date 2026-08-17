from datetime import date, timedelta
from typing import Dict, Any, Tuple

class SRSManager:
    """
    SuperMemo-2 (SM-2) Spaced Repetition Algorithm Implementation.
    Ratings:
    0 - Again (Quên hẳn / Lặp lại ngay)
    1 - Hard (Khó nhớ)
    2 - Good (Nhớ bình thường)
    3 - Easy (Rất dễ)
    """

    @staticmethod
    def calculate_next_review(rating: int, ease_factor: float, interval_days: int, repetitions: int) -> Tuple[float, int, int, str, str]:
        """
        Calculates updated (ease_factor, interval_days, repetitions, due_date_str, state).
        """
        # Map ratings: 0: Again, 1: Hard, 2: Good, 3: Easy
        # SM-2 original scale is 0 to 5. Here we use 4-button scale (0->1, 1->3, 2->4, 3->5)
        sm2_q_map = {0: 1, 1: 3, 2: 4, 3: 5}
        q = sm2_q_map.get(rating, 4)

        # 1. Update Ease Factor (EF)
        # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        new_ef = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        if new_ef < 1.3:
            new_ef = 1.3
        new_ef = round(new_ef, 2)

        # 2. Update Repetitions & Interval
        if q < 3: # Failed (Again)
            new_reps = 0
            new_interval = 1
            state = "learning"
        else: # Passed
            new_reps = repetitions + 1
            if new_reps == 1:
                new_interval = 1
            elif new_reps == 2:
                new_interval = 6
            else:
                if rating == 1: # Hard
                    new_interval = max(1, int(interval_days * 1.2))
                elif rating == 3: # Easy
                    new_interval = max(1, int(interval_days * new_ef * 1.3))
                else: # Good
                    new_interval = max(1, int(interval_days * new_ef))
            state = "review"

        next_due = date.today() + timedelta(days=new_interval)
        return new_ef, new_interval, new_reps, next_due.isoformat(), state

srs_manager = SRSManager()
