# Project_FS - Real-Time Analytics Dashboard

## Technologies Used
- React
- Node.js
- Express
- Chart.js
- Socket.io
- MongoDB

---

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running locally on port 27017



---

## Project Structure
```
/Project_FS
  /server
    app.js
    /models
      Metric.js
  /client
    /src
      /components
        Dashboard.js
      App.js
```

---

## Description

This project demonstrates a simple real-time analytics dashboard. The backend simulates updates of a few key metrics every few seconds, stores them in MongoDB, and broadcasts live changes to all connected dashboards using Socket.io. The client (React) listens for updates and visualizes the data using Chart.js.

---

## Customization
- Add additional metrics by editing the `metricNames` array in `server/app.js` and updating the frontend accordingly.
- Make sure MongoDB is running before starting the backend.


