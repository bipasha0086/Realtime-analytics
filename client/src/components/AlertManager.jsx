import { useState, useEffect } from 'react';
import './AlertManager.css';

const AlertManager = ({ socket }) => {
    const [alerts, setAlerts] = useState([]);
    const [newAlert, setNewAlert] = useState({
        metricName: '',
        threshold: '',
        condition: 'above'
    });

    useEffect(() => {
        fetchAlerts();
        
        // Listen for new alerts
        socket.on('alert_triggered', (alert) => {
            setAlerts(prev => [...prev, alert]);
        });

        return () => {
            socket.off('alert_triggered');
        };
    }, [socket]);

    const fetchAlerts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/alerts/active');
            const data = await response.json();
            setAlerts(data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newAlert),
            });
            const data = await response.json();
            setAlerts(prev => [...prev, data]);
            setNewAlert({
                metricName: '',
                threshold: '',
                condition: 'above'
            });
        } catch (error) {
            console.error('Error creating alert:', error);
        }
    };

    const resolveAlert = async (alertId) => {
        try {
            await fetch(`http://localhost:5000/api/alerts/${alertId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'resolved' }),
            });
            setAlerts(prev => prev.filter(alert => alert._id !== alertId));
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    return (
        <div className="alert-manager">
            <h2>Alert Manager</h2>
            
            <form onSubmit={handleSubmit} className="alert-form">
                <div className="form-group">
                    <label>Metric Name:</label>
                    <input
                        type="text"
                        value={newAlert.metricName}
                        onChange={(e) => setNewAlert(prev => ({
                            ...prev,
                            metricName: e.target.value
                        }))}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Threshold:</label>
                    <input
                        type="number"
                        value={newAlert.threshold}
                        onChange={(e) => setNewAlert(prev => ({
                            ...prev,
                            threshold: e.target.value
                        }))}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Condition:</label>
                    <select
                        value={newAlert.condition}
                        onChange={(e) => setNewAlert(prev => ({
                            ...prev,
                            condition: e.target.value
                        }))}
                    >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                    </select>
                </div>
                
                <button type="submit" className="submit-btn">Create Alert</button>
            </form>

            <div className="alerts-list">
                <h3>Active Alerts</h3>
                {alerts.map(alert => (
                    <div key={alert._id} className="alert-item">
                        <div className="alert-info">
                            <span className="metric-name">{alert.metricName}</span>
                            <span className="condition">
                                {alert.condition} {alert.threshold}
                            </span>
                            <span className="timestamp">
                                Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                            </span>
                        </div>
                        <button
                            onClick={() => resolveAlert(alert._id)}
                            className="resolve-btn"
                        >
                            Resolve
                        </button>
                    </div>
                ))}
                {alerts.length === 0 && (
                    <p className="no-alerts">No active alerts</p>
                )}
            </div>
        </div>
    );
};

export default AlertManager;