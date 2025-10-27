# 🏠 POZI Student Rentals Platform

A modern, responsive student housing platform built for Namibian universities. Find your perfect student accommodation with ease!

## 🌟 Features

### 🎯 **Core Functionality**
- **Dynamic Property Search** - Filter by university, amenities, and text search
- **Interactive Maps** - Leaflet.js integration showing property and university locations
- **Real-time Distance Calculation** - Shows distance to nearest universities
- **Mobile-Responsive Design** - Optimized for all devices
- **Professional UI/UX** - Clean, modern interface inspired by Apple/Google design

### 🏫 **University Integration**
- **Multi-University Support** - UNAM, NUST, and other Namibian institutions
- **Dynamic University Data** - Fetched from Directus CMS
- **Distance-Based Search** - Find properties closest to your university
- **University-Specific Filtering** - Filter properties by specific institutions

### 🏠 **Property Management**
- **Featured Properties** - Showcase best properties on homepage
- **Detailed Property Pages** - Complete property information with image galleries
- **Amenity Filtering** - Search by Wi-Fi, parking, security, etc.
- **Price Display** - Namibian Dollar (N$) currency formatting
- **Image Galleries** - Multiple property photos with smooth transitions

### 📱 **Mobile Experience**
- **Mobile App Preview** - Showcase mobile app with download buttons
- **Responsive Design** - Works perfectly on all screen sizes
- **Touch-Friendly Interface** - Optimized for mobile interactions

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js with React-Leaflet
- **CMS**: Directus (Headless CMS)
- **Deployment**: Vercel-ready

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zamtouch/pozi_website.git
   cd pozi_website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   DIRECTUS_BASE_URL=https://pozi2.omaridigital.com
   DIRECTUS_TOKEN=your_directus_token_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── about/             # About page
│   ├── property/[slug]/   # Dynamic property detail pages
│   ├── search/            # Property search page
│   └── universities/      # Universities listing page
├── components/            # Reusable React components
│   ├── layout/           # Header, footer components
│   ├── ui/               # UI components (buttons, cards, etc.)
│   ├── hero-search.tsx   # Homepage search component
│   ├── map-component.tsx # Interactive map component
│   └── property-card.tsx # Property card component
└── lib/                  # Utility functions and API calls
    ├── api.ts           # Directus API integration
    └── utils.ts         # Helper functions
```

## 🎨 Key Components

### **Property Search**
- Dynamic university filtering
- Amenity-based search
- Text search functionality
- Real-time results

### **Interactive Maps**
- Property location markers
- University location markers
- Distance calculation
- Google Maps integration

### **Property Cards**
- Dynamic distance calculation
- University information
- Amenity display
- Responsive design

## 🔧 API Integration

The platform integrates with Directus CMS for:
- Property data management
- University information
- Image asset management
- Content updates

### **API Endpoints Used**
- `items/properties` - Property listings
- `items/universities` - University data
- `assets/{id}` - Image assets

## 🌍 Namibian Focus

Built specifically for Namibian students with:
- **Local Universities** - UNAM, NUST, and other institutions
- **Namibian Currency** - N$ (Namibian Dollar) formatting
- **Local Context** - Designed for Namibian student needs
- **Regional Features** - Distance calculations for local geography

## 📱 Mobile App Integration

- **Download Buttons** - iOS and Android app store links
- **Mobile Preview** - Live property showcase
- **Responsive Design** - Mobile-first approach

## 🎯 Recent Updates

- ✅ Dynamic distance calculation to nearest universities
- ✅ Interactive maps with university markers
- ✅ Mobile app showcase section
- ✅ Professional about page redesign
- ✅ Currency formatting for Namibian Dollar
- ✅ Real-time property search functionality

## 🚀 Deployment

The platform is ready for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with one click

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

For questions or support, please contact the development team.

---

**Built with ❤️ for Namibian students** 🇳🇦