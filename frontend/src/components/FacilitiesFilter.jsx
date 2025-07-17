import { hotelFacilities } from "../config/hotel-config"; //has possible types of facilites

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
      }}
    >
      <h4
        style={{
          fontSize: "1.125rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
        }}
      >
        Facilities
      </h4>
      {hotelFacilities.map((facility, index) => (
        <label
          key={index}
          style={{
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
            value={facility}
            checked={selectedFacilities.includes(facility)}
            onChange={onChange}
          />
          <span>{facility}</span>
        </label>
      ))}
    </div>
  );
};

export default FacilitiesFilter;
