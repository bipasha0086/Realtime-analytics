from datetime import datetime

class MetricModel:
    @staticmethod
    def create(name, value, timestamp=None):
        return {
            "name": name,
            "value": value,
            "timestamp": timestamp or datetime.utcnow()
        }

class AlertModel:
    @staticmethod
    def create(metricName, threshold, condition, status='active', triggeredAt=None, resolvedAt=None):
        return {
            "metricName": metricName,
            "threshold": threshold,
            "condition": condition,
            "status": status,
            "triggeredAt": triggeredAt or datetime.utcnow(),
            "resolvedAt": resolvedAt
        }
