from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# 🚑 Dummy ambulance data
ambulances = [
    {"id": 1, "lat": 19.0760, "lng": 72.8777, "available": True},
    {"id": 2, "lat": 19.2183, "lng": 72.9781, "available": True},
    {"id": 3, "lat": 19.0330, "lng": 72.8450, "available": True}
]

# 📏 Simple distance calculation
def calculate_distance(lat1, lng1, lat2, lng2):
    return ((lat1 - lat2)**2 + (lng1 - lng2)**2) ** 0.5


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/request_ambulance', methods=['POST'])
def request_ambulance():
    data = request.json
    user_lat = data['lat']
    user_lng = data['lng']
    severity = data['severity']

    # 🧠 AI-like priority logic
    if severity == "high":
        eta = 3
    elif severity == "medium":
        eta = 7
    else:
        eta = 12

    # 🚑 Find nearest available ambulance
    available = [a for a in ambulances if a["available"]]

    if not available:
        return jsonify({"status": "no ambulance available"})

    nearest = min(
        available,
        key=lambda a: calculate_distance(user_lat, user_lng, a['lat'], a['lng'])
    )

    nearest["available"] = False

    # 🏥 Hospital suggestion (can improve later)
    hospital = {
        "name": "City Hospital",
        "lat": 19.082,
        "lng": 72.88
    }

    return jsonify({
        "status": "assigned",
        "ambulance": nearest,
        "eta": eta,
        "hospital": hospital
    })



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)