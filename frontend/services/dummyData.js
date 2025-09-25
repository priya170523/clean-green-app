export const dummyUsers = [
{
id: 'u1',
name: 'Satya',
email: 'satya@example.com',
phone: '9876543210',
points: 120,
totalWaste: 15,
rewards: ['COUPON50ZOMATO', 'SWIGGY20OFF'],
impact: { co2Saved: 30, trees: 2, landfill: 12 }
},
{
id: 'u2',
name: 'Priya',
email: 'priya@example.com',
phone: '9123456780',
points: 80,
totalWaste: 9,
rewards: ['ZOMATO10FREE'],
impact: { co2Saved: 18, trees: 1, landfill: 7 }
}
];


export const dummyWasteSubmissions = [
{
id: 'w1',
userId: 'u1',
image: 'https://dummyimage.com/400x300/00c897/fff&text=Plastic+Bottle',
weight: 2.5,
status: 'approved',
pickup: 'p1',
date: '2025-09-01'
},
{
id: 'w2',
userId: 'u2',
image: 'https://dummyimage.com/400x300/006c67/fff&text=Plastic+Bag',
weight: 1.2,
status: 'pending',
pickup: 'p2',
date: '2025-09-10'
}
];


export const dummyCoupons = [
{ id: 'c1', userId: 'u1', partner: 'Zomato', code: 'COUPON50ZOMATO', expiry: '2025-12-31', redeemed: false },
{ id: 'c2', userId: 'u1', partner: 'Swiggy', code: 'SWIGGY20OFF', expiry: '2025-11-30', redeemed: false },
{ id: 'c3', userId: 'u2', partner: 'Zomato', code: 'ZOMATO10FREE', expiry: '2025-10-15', redeemed: true }
];



// Dummy pickup locations and customer data
export const dummyPickupLocations = [
  {
    id: 'pl1',
    customerName: 'Satya Sharma',
    customerPhone: '9876543210',
    address: {
      formattedAddress: '123 MG Road, Bangalore, Karnataka 560001',
      latitude: 12.9758,
      longitude: 77.6033
    },
    wasteType: 'Mixed',
    estimatedWeight: 3.5,
    wasteDetails: {
      foodBoxes: 2,
      bottles: 5,
      otherItems: 'Cardboard boxes'
    },
    images: ['https://dummyimage.com/400x300/00c897/fff&text=Waste+Image+1'],
    earnings: '75-120',
    priority: 'normal'
  },
  {
    id: 'pl2',
    customerName: 'Priya Patel',
    customerPhone: '9123456789',
    address: {
      formattedAddress: '456 Brigade Road, Bangalore, Karnataka 560025',
      latitude: 12.9716,
      longitude: 77.6131
    },
    wasteType: 'Plastic',
    estimatedWeight: 2.2,
    wasteDetails: {
      bottles: 8,
      plasticBags: 3
    },
    images: ['https://dummyimage.com/400x300/006c67/fff&text=Plastic+Waste'],
    earnings: '60-90',
    priority: 'normal'
  },
  {
    id: 'pl3',
    customerName: 'Ravi Kumar',
    customerPhone: '9988776655',
    address: {
      formattedAddress: '789 Commercial Street, Bangalore, Karnataka 560001',
      latitude: 12.9822,
      longitude: 77.6025
    },
    wasteType: 'Paper',
    estimatedWeight: 4.1,
    wasteDetails: {
      cardboard: 5,
      newspapers: 10
    },
    images: ['https://dummyimage.com/400x300/4a90e2/fff&text=Paper+Waste'],
    earnings: '80-110',
    priority: 'scheduled'
  }
];

// Dummy dashboard statistics
export const dummyDashboardStats = {
  totalPickups: 15,
  totalPoints: 120,
  todayPickups: 3,
  todayEarnings: 240,
  monthlyEarnings: 3200,
  rating: {
    average: 4.7,
    total: 89
  },
  completedPickups: 12,
  pendingPickups: 3
};

// Dummy delivery dashboard data
export const dummyDeliveryDashboardData = {
  todayPickups: 5,
  todayEarnings: 450,
  totalEarnings: 12500,
  completedDeliveries: 156,
  rating: {
    average: 4.8,
    total: 134
  },
  stats: {
    totalPickups: 156,
    totalPoints: 780,
    todayPickups: 5,
    todayEarnings: 450
  }
};

// Dummy notifications
export const dummyNotifications = [
  {
    id: 'n1',
    type: 'pickup_request',
    title: 'New Pickup Request',
    message: 'Pickup available 2.3 km away at MG Road',
    location: {
      latitude: 12.9758,
      longitude: 77.6033,
      address: '123 MG Road, Bangalore'
    },
    earnings: '₹75-120',
    distance: 2.3,
    pickupData: {
      _id: 'p1',
      customerName: 'Satya Sharma',
      customerPhone: '9876543210',
      address: {
        formattedAddress: '123 MG Road, Bangalore, Karnataka 560001',
        latitude: 12.9758,
        longitude: 77.6033
      },
      wasteType: 'Mixed',
      estimatedWeight: 3.5,
      earnings: '75-120'
    }
  },
  {
    id: 'n2',
    type: 'pickup_request',
    title: 'New Pickup Request',
    message: 'Pickup available 1.8 km away at Brigade Road',
    location: {
      latitude: 12.9716,
      longitude: 77.6131,
      address: '456 Brigade Road, Bangalore'
    },
    earnings: '₹60-90',
    distance: 1.8,
    pickupData: {
      _id: 'p2',
      customerName: 'Priya Patel',
      customerPhone: '9123456789',
      address: {
        formattedAddress: '456 Brigade Road, Bangalore, Karnataka 560025',
        latitude: 12.9716,
        longitude: 77.6131
      },
      wasteType: 'Plastic',
      estimatedWeight: 2.2,
      earnings: '60-90'
    }
  },
  {
    id: 'n3',
    type: 'pickup_request',
    title: 'New Pickup Request',
    message: 'Pickup available 3.1 km away at Commercial Street',
    location: {
      latitude: 12.9822,
      longitude: 77.6025,
      address: '789 Commercial Street, Bangalore'
    },
    earnings: '₹80-110',
    distance: 3.1,
    pickupData: {
      _id: 'p3',
      customerName: 'Ravi Kumar',
      customerPhone: '9988776655',
      address: {
        formattedAddress: '789 Commercial Street, Bangalore, Karnataka 560001',
        latitude: 12.9822,
        longitude: 77.6025
      },
      wasteType: 'Paper',
      estimatedWeight: 4.1,
      earnings: '80-110'
    }
  }
];

// Warehouse location
export const warehouseLocation = {
  latitude: 12.9352,
  longitude: 77.6245,
  address: 'Waste Management Facility, Whitefield, Bangalore'
};
