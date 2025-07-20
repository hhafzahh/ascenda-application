import { roomAmenities } from "../config/hotel-config"; //has possible types of facilites

const FacilitiesFilter = ({ selectedFacilities, onChange }) => {
  return (
    <div
      style={{
        //backgroundColor: "lightgrey",
        borderBottom: "1px solid #cbd5e0",
        paddingBottom: "1.25rem",
        paddingLeft: "2rem",
        paddingRight: "2rem",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        marginTop: "3rem",
      }}
    >
      <h4
        style={{
          fontSize: "0.8rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
        }}
      >
        Room amenities
      </h4>
      {roomAmenities.map((facility, index) => (
        <label
          key={facility.key}
          style={{
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <input
            type="checkbox"
            style={{
              borderRadius: "0.25rem", // rounded
            }}
            value={facility.key}
            checked={selectedFacilities.includes(facility.key)}
            onChange={onChange}
          />
          <span>{facility.label}</span>
        </label>
      ))}
    </div>
  );
};

export default FacilitiesFilter;
