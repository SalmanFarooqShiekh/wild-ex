import * as React from "react";
import { Spinner } from "react-bootstrap";

const FullScreenSpinner = ({ show }: {show: boolean}) => {
  return (
    <div
      style={{
        ...{
          position: "fixed",
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 123456789,
        },
        ...{
          display: show ? "flex" : "none",
        },
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        }}
      />
      <div style={{ zIndex: 1234567890 }}>
        <Spinner animation={"border"} variant={"light"} role={"status"} />
      </div>
    </div>
  );
};

export default FullScreenSpinner;
