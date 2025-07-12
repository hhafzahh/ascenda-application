import React, { useState } from 'react';
import './GuestRoomSelector.css';

export default function GuestRoomSelector({ adults, children, rooms, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = (type, op) => {
    let newAdults = adults;
    let newChildren = children;
    let newRooms = rooms;

    if (type === 'adults') newAdults = Math.max(1, adults + (op === '+' ? 1 : -1));
    if (type === 'children') newChildren = Math.max(0, children + (op === '+' ? 1 : -1));
    if (type === 'rooms') newRooms = Math.max(1, rooms + (op === '+' ? 1 : -1));

    onChange({ adults: newAdults, children: newChildren, rooms: newRooms });
  };

  return (
    <div className="guest-selector">
      <button onClick={() => setIsOpen(!isOpen)} className="guest-toggle">
        {adults} adult(s) · {children} child(ren) · {rooms} room(s)
      </button>

      {isOpen && (
        <div className="dropdown">
          {[
            { label: 'Adults', value: adults, key: 'adults' },
            { label: 'Children', value: children, key: 'children' },
            { label: 'Rooms', value: rooms, key: 'rooms' }
          ].map(({ label, value, key }) => (
            <div className="row" key={key}>
              <span>{label}</span>
              <div className="stepper">
                <button onClick={() => handleUpdate(key, '-')}>−</button>
                <span>{value}</span>
                <button onClick={() => handleUpdate(key, '+')}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}