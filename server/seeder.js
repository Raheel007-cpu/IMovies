const mongoose = require("mongoose");
const dotenv = require("dotenv");
const {
  User,
  City,
  Theatre,
  Screen,
  Seat,
  Movie,
  Show,
  ShowSeat,
  Booking,
} = require("./models");

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    console.log("🧹 Clearing all IMovies collections...");
    await ShowSeat.deleteMany();
    await Booking.deleteMany();
    await Show.deleteMany();
    await Seat.deleteMany();
    await Screen.deleteMany();
    await Theatre.deleteMany();
    await City.deleteMany();
    await Movie.deleteMany();
    await User.deleteMany();

    // Safely drop any stale text indexes on movies to allow new index options to take effect
    try {
      await Movie.collection.dropIndexes();
    } catch (e) {
      // Collection may not have custom indexes yet
    }

    console.log("✨ All collections successfully cleared!");
  } catch (error) {
    console.error(`❌ Error clearing database: ${error.message}`);
    throw error;
  }
};

const importData = async () => {
  try {
    await destroyData();

    console.log("🌱 Inserting Seed Users...");
    const users = await User.create([
      {
        name: "Admin User",
        email: "admin@imovies.com",
        password: "adminpassword123",
        phone: "+919876543210",
        role: "admin",
      },
      {
        name: "Rahul Sharma",
        email: "rahul@imovies.com",
        password: "userpassword123",
        phone: "+919812345678",
        role: "user",
      },
      {
        name: "Priya Patel",
        email: "priya@imovies.com",
        password: "userpassword123",
        phone: "+919876501234",
        role: "user",
      },
    ]);

    const adminUser = users[0];
    const customerUser = users[1];

    console.log("🌱 Inserting Cities...");
    const cities = await City.create([
      { name: "Mumbai", state: "Maharashtra", isActive: true },
      { name: "Delhi-NCR", state: "Delhi", isActive: true },
      { name: "Bengaluru", state: "Karnataka", isActive: true },
      { name: "Hyderabad", state: "Telangana", isActive: true },
    ]);

    const mumbai = cities[0];
    const bengaluru = cities[2];

    console.log("🌱 Inserting Theatres...");
    const theatres = await Theatre.create([
      {
        name: "PVR ICON: Phoenix Palladium",
        city: mumbai._id,
        address: "High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai",
        amenities: ["Dolby Atmos", "4K Laser", "Recliner Seats", "Gourmet Food", "Valet Parking"],
        isActive: true,
      },
      {
        name: "INOX Megaplex: Inorbit Mall",
        city: mumbai._id,
        address: "Inorbit Mall, Link Road, Malad West, Mumbai",
        amenities: ["IMAX 3D", "Dolby Atmos", "MX4D", "Food Court", "Parking"],
        isActive: true,
      },
      {
        name: "PVR Vega City Mall",
        city: bengaluru._id,
        address: "Bannerghatta Main Rd, Dollars Colony, Bengaluru",
        amenities: ["Dolby Atmos", "4K Laser", "Recliners", "Parking"],
        isActive: true,
      },
    ]);

    console.log("🌱 Inserting Screens and Physical Seats layout...");
    const allScreens = [];
    const allSeats = [];

    for (const theatre of theatres) {
      // Create 2 screens per theatre
      for (let s = 1; s <= 2; s++) {
        const screen = await Screen.create({
          theatre: theatre._id,
          screenNumber: `${s}`,
          name: `Audi ${s} (${s === 1 ? "4K Laser" : "Dolby Atmos"})`,
          soundSystem: s === 1 ? "Dolby Atmos 7.1" : "Dolby Atmos 5.1",
          projectionType: s === 1 ? "Barco 4K Laser" : "Christie Digital 2K",
          totalSeats: 30, // 3 rows x 10 seats
        });

        allScreens.push(screen);

        // Generate physical seat layout for screen:
        // Row A: Silver (10 seats)
        // Row B: Gold (10 seats)
        // Row C: Platinum (10 seats)
        const rowConfigs = [
          { row: "A", category: "Silver", basePrice: 180 },
          { row: "B", category: "Gold", basePrice: 260 },
          { row: "C", category: "Platinum", basePrice: 380 },
        ];

        for (const config of rowConfigs) {
          for (let col = 1; col <= 10; col++) {
            allSeats.push({
              screen: screen._id,
              row: config.row,
              column: col,
              seatNumber: `${config.row}${col}`,
              category: config.category,
              basePrice: config.basePrice,
              isActive: true,
            });
          }
        }
      }
    }

    const createdSeats = await Seat.insertMany(allSeats);
    console.log(`✅ Created ${allScreens.length} screens and ${createdSeats.length} physical seats.`);

    console.log("🌱 Inserting Movies...");
    const movies = await Movie.create([
      {
        title: "Interstellar",
        description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
        genre: ["Sci-Fi", "Adventure", "Drama"],
        language: ["English", "Hindi"],
        duration: 169,
        releaseDate: new Date("2024-11-01"),
        posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1400&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        imdbId: "tt0816692",
        imdbRating: 8.7,
        imdbVotes: "2,617,722",
        rating: 8.7,
        votesCount: 2617722,
        certificate: "UA",
        status: "NOW_SHOWING",
        lastImdbSync: new Date(),
      },
      {
        title: "Dune: Part Two",
        description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe.",
        genre: ["Action", "Adventure", "Sci-Fi"],
        language: ["English", "Hindi", "Telugu"],
        duration: 166,
        releaseDate: new Date("2024-03-01"),
        posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
        imdbId: "tt15239678",
        imdbRating: 8.5,
        imdbVotes: "640,000",
        rating: 8.5,
        votesCount: 640000,
        certificate: "UA",
        status: "NOW_SHOWING",
        lastImdbSync: new Date(),
      },
      {
        title: "Oppenheimer",
        description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
        genre: ["Biography", "Drama", "History"],
        language: ["English", "Hindi"],
        duration: 180,
        releaseDate: new Date("2023-07-21"),
        posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80",
        trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
        imdbId: "tt15398776",
        imdbRating: 8.2,
        imdbVotes: "1,103,487",
        rating: 8.2,
        votesCount: 1103487,
        certificate: "A",
        status: "NOW_SHOWING",
        lastImdbSync: new Date(),
      },
      {
        title: "Avatar: Fire and Ash",
        description: "The third installment of James Cameron's Avatar saga exploring the Ash People, a more aggressive volcanic tribe of Na'vi on Pandora.",
        genre: ["Action", "Adventure", "Fantasy", "Sci-Fi"],
        language: ["English", "Hindi", "Tamil"],
        duration: 190,
        releaseDate: new Date("2025-12-19"),
        posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80",
        trailerUrl: "https://www.youtube.com",
        imdbId: "tt1757678",
        imdbRating: 0,
        imdbVotes: "0",
        rating: 0,
        votesCount: 0,
        certificate: "UA",
        status: "UPCOMING",
      },
    ]);

    console.log("🌱 Scheduling Shows for Now Showing Movies...");
    const nowShowingMovies = movies.filter((m) => m.status === "NOW_SHOWING");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const showTimes = [
      { startH: 10, startM: 0, endH: 13, endM: 0 },
      { startH: 14, startM: 30, endH: 17, endM: 30 },
      { startH: 18, startM: 45, endH: 21, endM: 45 },
      { startH: 22, startM: 15, endH: 1, endM: 15, nextDay: true },
    ];

    const createdShows = [];
    const createdShowSeats = [];

    // Schedule shows for today and tomorrow on the first screen of each theatre
    for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(showDate.getDate() + dayOffset);

      for (let i = 0; i < nowShowingMovies.length; i++) {
        const movie = nowShowingMovies[i];
        const theatre = theatres[i % theatres.length];
        const screen = allScreens.find((s) => s.theatre.toString() === theatre._id.toString());

        if (!screen) continue;

        const timeSlot = showTimes[i % showTimes.length];
        const startTime = new Date(showDate);
        startTime.setHours(timeSlot.startH, timeSlot.startM, 0, 0);

        const endTime = new Date(showDate);
        if (timeSlot.nextDay) {
          endTime.setDate(endTime.getDate() + 1);
        }
        endTime.setHours(timeSlot.endH, timeSlot.endM, 0, 0);

        const pricing = [
          { category: "Silver", price: 200 },
          { category: "Gold", price: 280 },
          { category: "Platinum", price: 400 },
        ];

        const show = await Show.create({
          movie: movie._id,
          theatre: theatre._id,
          screen: screen._id,
          startTime,
          endTime,
          pricing,
          isActive: true,
        });

        createdShows.push(show);

        // Fetch physical seats for this screen to generate ShowSeats
        const screenSeats = createdSeats.filter((s) => s.screen.toString() === screen._id.toString());

        for (const seat of screenSeats) {
          const priceObj = pricing.find((p) => p.category === seat.category) || { price: seat.basePrice };

          createdShowSeats.push({
            show: show._id,
            seat: seat._id,
            seatNumber: seat.seatNumber,
            row: seat.row,
            column: seat.column,
            category: seat.category,
            price: priceObj.price,
            status: "AVAILABLE",
            heldBy: null,
            heldExpiresAt: null,
            booking: null,
          });
        }
      }
    }

    await ShowSeat.insertMany(createdShowSeats);
    console.log(`✅ Scheduled ${createdShows.length} shows and populated ${createdShowSeats.length} individual ShowSeats.`);

    // Sample Booking for the first show
    if (createdShows.length > 0) {
      const sampleShow = createdShows[0];
      const showSeatsForShow = await ShowSeat.find({ show: sampleShow._id }).limit(2);

      if (showSeatsForShow.length >= 2) {
        const bookedSeat1 = showSeatsForShow[0];
        const bookedSeat2 = showSeatsForShow[1];

        const totalAmount = bookedSeat1.price + bookedSeat2.price;
        const convenienceFee = 30;
        const taxAmount = Math.round(convenienceFee * 0.18);
        const finalAmount = totalAmount + convenienceFee + taxAmount;

        const booking = await Booking.create({
          bookingNumber: `IMV-${Date.now().toString().slice(-8)}-DEMO`,
          user: customerUser._id,
          show: sampleShow._id,
          seats: [
            {
              showSeat: bookedSeat1._id,
              seat: bookedSeat1.seat,
              seatNumber: bookedSeat1.seatNumber,
              category: bookedSeat1.category,
              price: bookedSeat1.price,
            },
            {
              showSeat: bookedSeat2._id,
              seat: bookedSeat2.seat,
              seatNumber: bookedSeat2.seatNumber,
              category: bookedSeat2.category,
              price: bookedSeat2.price,
            },
          ],
          totalAmount,
          convenienceFee,
          taxAmount,
          finalAmount,
          paymentStatus: "COMPLETED",
          paymentMethod: "MOCK_UPI",
          paymentTransactionId: `TXN-${Date.now()}`,
          bookingStatus: "CONFIRMED",
        });

        // Mark ShowSeats as BOOKED
        await ShowSeat.updateMany(
          { _id: { $in: [bookedSeat1._id, bookedSeat2._id] } },
          { $set: { status: "BOOKED", booking: booking._id } }
        );

        console.log(`✅ Created 1 sample verified booking: ${booking.bookingNumber}`);
      }
    }

    console.log("🎉 Database Seeding Completed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  if (process.argv[2] === "-d") {
    await destroyData();
    process.exit(0);
  } else {
    await importData();
  }
};

run();

