import os
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

STATUSES = {
    "Available", "Claimed", "Pickup Scheduled", "Collected",
    "Delivered", "Cancelled", "Expired"
}

# Local demo storage. Records reset when the server restarts.
donations = [
    {
        "id": "demo-001",
        "foodName": "Vegetable rice and curry",
        "category": "Cooked Meals",
        "quantityKg": 8,
        "portions": 20,
        "preparedAt": "2026-10-15T10:00",
        "pickupDeadline": "2026-10-15T18:00",
        "location": "Coimbatore",
        "donorName": "Community Kitchen",
        "notes": "Contains vegetables; confirm ingredients and allergens with donor.",
        "status": "Available",
        "createdAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "demo-002",
        "foodName": "Packaged bread",
        "category": "Bakery",
        "quantityKg": 4,
        "portions": 15,
        "preparedAt": "2026-10-15T09:00",
        "pickupDeadline": "2026-10-16T09:00",
        "location": "Peelamedu, Coimbatore",
        "donorName": "Demo Bakery",
        "notes": "Check package labels and date information before collection.",
        "status": "Available",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
]

def match_score(donation, ngo):
    """Explainable demo score (0-100), not a trained ML prediction."""
    score = 0
    reasons = []
    donor_location = str(donation.get("location", "")).lower()
    ngo_location = str(ngo.get("location", "")).lower()
    if donor_location and ngo_location and (
        donor_location in ngo_location or ngo_location in donor_location
    ):
        score += 35
        reasons.append("Location appears compatible")
    else:
        reasons.append("Location needs manual confirmation")
    try:
        capacity = float(ngo.get("capacityKg", 0))
        quantity = float(donation.get("quantityKg", 0))
        if capacity >= quantity:
            score += 30
            reasons.append("Capacity can cover the listed quantity")
        else:
            score += max(0, int(30 * capacity / max(quantity, 1)))
            reasons.append("Capacity may be lower than the listed quantity")
    except (ValueError, TypeError):
        reasons.append("Capacity not supplied")
    categories = [str(x).lower() for x in ngo.get("foodCategories", [])]
    if not categories or str(donation.get("category", "")).lower() in categories:
        score += 20
        reasons.append("Food category is compatible or unrestricted")
    else:
        reasons.append("Confirm food category compatibility")
    if donation.get("status") == "Available":
        score += 15
        reasons.append("Donation is currently listed as available")
    return {"score": min(100, score), "reasons": reasons}

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "mode": "local-demo"})

@app.get("/api/donations")
def get_donations():
    status = request.args.get("status")
    result = donations
    if status:
        result = [d for d in result if d.get("status") == status]
    return jsonify(result)

@app.post("/api/donations")
def create_donation():
    data = request.get_json(silent=True) or {}
    required = ["foodName", "category", "quantityKg", "pickupDeadline", "location", "donorName"]
    missing = [field for field in required if data.get(field) in (None, "")]
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400
    try:
        quantity = float(data["quantityKg"])
        if quantity <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "quantityKg must be a positive number"}), 400
    record = {
        "id": str(uuid.uuid4()),
        "foodName": str(data["foodName"]).strip(),
        "category": str(data["category"]).strip(),
        "quantityKg": quantity,
        "portions": int(data.get("portions") or 0),
        "preparedAt": data.get("preparedAt", ""),
        "pickupDeadline": str(data["pickupDeadline"]),
        "location": str(data["location"]).strip(),
        "donorName": str(data["donorName"]).strip(),
        "notes": str(data.get("notes", "")).strip(),
        "status": "Available",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    donations.insert(0, record)
    return jsonify(record), 201

@app.post("/api/donations/<donation_id>/claim")
def claim_donation(donation_id):
    data = request.get_json(silent=True) or {}
    ngo_name = str(data.get("ngoName", "")).strip()
    if not ngo_name:
        return jsonify({"error": "ngoName is required"}), 400
    record = next((d for d in donations if d["id"] == donation_id), None)
    if not record:
        return jsonify({"error": "Donation not found"}), 404
    if record["status"] != "Available":
        return jsonify({"error": "Donation is not available to claim"}), 409
    record["status"] = "Claimed"
    record["claimedBy"] = ngo_name
    record["claimedAt"] = datetime.now(timezone.utc).isoformat()
    return jsonify(record)

@app.patch("/api/donations/<donation_id>/status")
def update_status(donation_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in STATUSES:
        return jsonify({"error": "Invalid status", "allowed": sorted(STATUSES)}), 400
    record = next((d for d in donations if d["id"] == donation_id), None)
    if not record:
        return jsonify({"error": "Donation not found"}), 404
    record["status"] = status
    record["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return jsonify(record)

@app.post("/api/match")
def recommend_ngo():
    data = request.get_json(silent=True) or {}
    donation = data.get("donation") or {}
    ngos = data.get("ngos") or []
    ranked = []
    for ngo in ngos:
        result = match_score(donation, ngo)
        ranked.append({**ngo, **result})
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return jsonify({"recommendations": ranked, "method": "explainable rule-based demo score"})

@app.get("/api/impact")
def impact():
    delivered = [d for d in donations if d.get("status") == "Delivered"]
    return jsonify({
        "donationsListed": len(donations),
        "donationsDelivered": len(delivered),
        "foodDeliveredKg": round(sum(float(d.get("quantityKg", 0)) for d in delivered), 2),
        "demoMode": True,
        "note": "Counts reflect local demo records only; they are not verified community impact."
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True)
