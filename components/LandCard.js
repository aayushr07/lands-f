// components/LandCard.js

import Link from "next/link";

const LandCard = ({ land }) => {
  return (
    <div style={styles.card}>
      <h3>{land.title}</h3>
      <p><b>Location:</b> {land.location}</p>
      <p><b>Price:</b> ₹{land.price}</p>

      <Link href={`/land/${land._id}`}>
        <button style={styles.button}>View Details</button>
      </Link>
    </div>
  );
};

const styles = {
  card: {
    border: "1px solid #ccc",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "10px",
  },
  button: {
    marginTop: "10px",
    padding: "8px",
    cursor: "pointer",
  },
};

export default LandCard;