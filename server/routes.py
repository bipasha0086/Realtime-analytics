from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson.objectid import ObjectId

def create_routes(db):
    bp = Blueprint('api', __name__)

    # --- Metrics Routes ---
    @bp.route('/metrics', methods=['GET'])
    def get_metrics():
        try:
            # Get latest metric for each name
            metrics_cursor = db.metrics.find().sort("timestamp", -1).limit(1000)
            grouped = {}
            for m in metrics_cursor:
                m['_id'] = str(m['_id'])
                if m['name'] not in grouped:
                    grouped[m['name']] = m
            return jsonify(list(grouped.values()))
        except Exception as e:
            return str(e), 500

    @bp.route('/metrics/<name>/history', methods=['GET'])
    def get_metric_history(name):
        try:
            hours = float(request.args.get('hours', 24))
            since = datetime.utcnow() - timedelta(hours=hours)

            history = db.metrics.find(
                {"name": name, "timestamp": {"$gte": since}},
                {"_id": 0, "value": 1, "timestamp": 1}
            ).sort("timestamp", 1)
            
            return jsonify(list(history))
        except Exception as e:
            return str(e), 500

    @bp.route('/metrics/aggregate', methods=['GET'])
    def get_metrics_aggregate():
        try:
            hours = float(request.args.get('hours', 24))
            since = datetime.utcnow() - timedelta(hours=hours)

            pipeline = [
                {"$match": {"timestamp": {"$gte": since}}},
                {"$group": {
                    "_id": "$name",
                    "min": {"$min": "$value"},
                    "max": {"$max": "$value"},
                    "avg": {"$avg": "$value"}
                }}
            ]
            aggregates = list(db.metrics.aggregate(pipeline))
            return jsonify(aggregates)
        except Exception as e:
            return str(e), 500

    # --- Alerts Routes ---
    @bp.route('/alerts', methods=['POST'])
    def create_alert():
        try:
            data = request.json
            data['triggeredAt'] = datetime.utcnow()
            if 'status' not in data:
                data['status'] = 'active'
            
            result = db.alerts.insert_one(data)
            data['_id'] = str(result.inserted_id)
            return jsonify(data), 201
        except Exception as e:
            return jsonify({"message": str(e)}), 400

    @bp.route('/alerts/active', methods=['GET'])
    def get_active_alerts():
        try:
            alerts = list(db.alerts.find({"status": "active"}))
            for a in alerts:
                a['_id'] = str(a['_id'])
            return jsonify(alerts)
        except Exception as e:
            return jsonify({"message": str(e)}), 500

    @bp.route('/alerts/<id>', methods=['PATCH'])
    def update_alert(id):
        try:
            update_data = {"status": request.json.get('status')}
            if update_data['status'] == 'resolved':
                update_data['resolvedAt'] = datetime.utcnow()
            
            db.alerts.update_one({"_id": ObjectId(id)}, {"$set": update_data})
            alert = db.alerts.find_one({"_id": ObjectId(id)})
            alert['_id'] = str(alert['_id'])
            return jsonify(alert)
        except Exception as e:
            return jsonify({"message": str(e)}), 400

    @bp.route('/alerts/stats/<metric_name>', methods=['GET'])
    def get_alert_stats(metric_name):
        try:
            hours = float(request.args.get('hours', 24))
            since = datetime.utcnow() - timedelta(hours=hours)

            pipeline = [
                {"$match": {"name": metric_name, "timestamp": {"$gte": since}}},
                {"$group": {
                    "_id": None,
                    "min": {"$min": "$value"},
                    "max": {"$max": "$value"},
                    "avg": {"$avg": "$value"},
                    "stdDev": {"$stdDevPop": "$value"}
                }}
            ]
            stats = list(db.metrics.aggregate(pipeline))
            result = stats[0] if stats else {}
            if "_id" in result:
                del result["_id"]
            return jsonify(result)
        except Exception as e:
            return jsonify({"message": str(e)}), 500

    return bp
