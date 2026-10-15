# ML module

The current application uses an **explainable rule-based NGO matching score**, not a trained ML model. This is deliberate for a starter project because reliable historical donation data may not yet exist.

Suggested next steps:
1. Collect consented, relevant records with outcomes such as claimed/not claimed before deadline.
2. Remove personal data not needed for training.
3. Split training and evaluation data without leakage.
4. Train a baseline classifier and compare it with Random Forest.
5. Evaluate precision, recall and F1; monitor performance over time.
6. Label synthetic training data as synthetic and do not claim it demonstrates real-world effectiveness.

Any unclaimed-risk estimate is for operational prioritization only, never for food-safety decisions.
