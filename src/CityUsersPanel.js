import React from "react";

const CityUsersPanel = ({ users = [] }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        width: 300,
        maxHeight: "80vh",
        overflowY: "auto",
        background: "white",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.25)",
        zIndex: 9999,
      }}
    >
      <h3 style={{ marginBottom: 10 }}>🚚 City Transporters</h3>

      {users.length === 0 ? (
        <p style={{ fontSize: 13, color: "#777" }}>
          No transporters available
        </p>
      ) : (
        users.map((user, index) => (
          <div
            key={index}
            style={{
              padding: 10,
              borderBottom: "1px solid #eee",
            }}
          >
            <b>{user.fullName || "Unknown"}</b>
            <div style={{ fontSize: 12 }}>
              🚛 {user.vehicleType || "No vehicle"}
            </div>
            <div style={{ fontSize: 12 }}>
              📍 {user.city || "Unknown city"}
            </div>
            <div style={{ fontSize: 12 }}>
              ⭐ {user.rating || 0}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CityUsersPanel;