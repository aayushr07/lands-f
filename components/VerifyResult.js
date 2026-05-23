// components/VerifyResult.js

const VerifyResult = ({ result }) => {
  if (!result) return null;

  return (
    <div style={styles.box}>
      <h3>Verification Result</h3>
      <p><b>Status:</b> {result.status}</p>
      <p><b>Confidence:</b> {result.confidence}%</p>
      <p><b>Details:</b> {result.details}</p>
    </div>
  );
};

const styles = {
  box: {
    border: "1px solid green",
    padding: "15px",
    marginTop: "10px",
  },
};

export default VerifyResult;