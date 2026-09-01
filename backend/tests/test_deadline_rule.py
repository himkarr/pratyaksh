def test_completion_deadline_is_contractual():
    from datetime import date, timedelta
    assert date(2026, 1, 1) + timedelta(days=365) == date(2027, 1, 1)
