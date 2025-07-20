const hotelApiService = require("./hotelAPIService");

//gets functions from service
exports.getHotelsByUid = hotelApiService.getHotelsByUid;
exports.getHotels = hotelApiService.getHotels;
exports.getRooms = hotelApiService.getRooms;
exports.getHotelByHotelId = hotelApiService.getHotelByHotelId;
exports.getHotelById = hotelApiService.getHotelById;
