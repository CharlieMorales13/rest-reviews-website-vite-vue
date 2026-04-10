import pandas as pd

from .value_objects import IGEWeights


class IGECalculator:
    @staticmethod
    def calculate(
        food: float,
        service: float,
        price: float,
        weights: IGEWeights = IGEWeights(),
    ) -> float:
        """Return IGE score in the 0–100 range for a single review."""
        raw = (food * weights.food) + (service * weights.service) + (price * weights.price)
        return raw * weights.scale

    @staticmethod
    def calculate_global(
        reviews_df: pd.DataFrame,
        weights: IGEWeights = IGEWeights(),
    ) -> float:
        """Return the mean IGE score across all rows of *reviews_df*.

        The DataFrame must contain the columns: food_score, service_score, price_score.
        Returns 0.0 for an empty DataFrame.
        """
        if reviews_df.empty:
            return 0.0

        ige_series = (
            reviews_df["food_score"] * weights.food
            + reviews_df["service_score"] * weights.service
            + reviews_df["price_score"] * weights.price
        ) * weights.scale

        return float(ige_series.mean())
