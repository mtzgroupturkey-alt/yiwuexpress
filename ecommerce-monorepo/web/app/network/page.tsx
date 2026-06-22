import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { Globe, Building, Ship, Plane, MapPin, Activity } from 'lucide-react'

export default function NetworkPage() {
  const regions = [
    {
      name: 'Asia-Pacific Hubs',
      description: 'Our primary consolidation and sorting hubs connecting East Asia and Southeast Asia.',
      hubs: [
        { name: 'Yiwu Consolidation Hub', type: 'Warehousing & Cargo Center', capacity: '120,000 sqm' },
        { name: 'Ningbo Beilun Port Office', type: 'Sea Freight Consolidation', capacity: '85,000 sqm' },
        { name: 'Shanghai Pudong (PVG) Depot', type: 'Air Cargo Sorting Center', capacity: '50,000 sqm' },
        { name: 'Shenzhen Qianhai Warehouse', type: 'Cross-Border E-commerce Hub', capacity: '75,000 sqm' },
      ],
      shippingModes: ['Daily Sea Freight Departures', 'Daily Air Express Flights', 'Cross-Border Rail Networks'],
    },
    {
      name: 'European Corridors',
      description: 'Strategic distribution networks spanning Western, Central, and Eastern Europe.',
      hubs: [
        { name: 'Rotterdam Distribution Center', type: 'Maritime Gateway Depot', capacity: '90,000 sqm' },
        { name: 'Frankfurt Airport Terminal 2', type: 'Air Freight Cargo Hub', capacity: '45,000 sqm' },
        { name: 'Warsaw Rail Terminal Depot', type: 'Belt and Road Land Corridor', capacity: '40,000 sqm' },
      ],
      shippingModes: ['Weekly Sea Freight Liners', 'Bi-weekly Air Cargo Charters', 'Direct Rail Freight Links'],
    },
    {
      name: 'North American Networks',
      description: 'Key distribution hubs servicing United States, Canada, and Mexico business markets.',
      hubs: [
        { name: 'LA / Long Beach Port Depot', type: 'Pacific Gateway Facility', capacity: '110,000 sqm' },
        { name: 'New York JFK Cargo Terminal', type: 'Atlantic Air Freight Center', capacity: '35,000 sqm' },
        { name: 'Chicago Inland logistics Hub', type: 'Rail & Intermodal Center', capacity: '60,000 sqm' },
      ],
      shippingModes: ['Twice-Weekly Sea Liners', 'Daily Air Cargo Allotments', 'Inland Intermodal Trucking'],
    },
    {
      name: 'Middle East & Africa Lanes',
      description: 'Growing transit lanes supporting emerging markets and trade routes.',
      hubs: [
        { name: 'Dubai Jebel Ali Depot', type: 'Transshipment Hub Center', capacity: '80,000 sqm' },
        { name: 'Riyadh Air Port Warehouse', type: 'Gulf Distribution Hub', capacity: '30,000 sqm' },
        { name: 'Cairo Logistics Center', type: 'North Africa Gateway', capacity: '25,000 sqm' },
      ],
      shippingModes: ['Weekly Maritime Routes', 'Tri-weekly Air Express Connections'],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Banner Section */}
        <section className="bg-gradient-primary text-white py-16 relative overflow-hidden">
          <div className="absolute inset-0 chinese-pattern opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl font-bold mb-4">Our Global Logistics Network</h1>
            <p className="text-lg text-gray-200 max-w-xl mx-auto">
              Connecting primary commodity hubs in China to local distribution depots worldwide with high-frequency shipping channels.
            </p>
          </div>
        </section>

        {/* Global Stats bar */}
        <section className="bg-white border-b border-gray-200 py-8 shadow-sm">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Global Hubs</span>
                <span className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Building className="w-5 h-5 text-primary-500" />
                  35+ Facilities
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Warehousing Capacity</span>
                <span className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Globe className="w-5 h-5 text-primary-500" />
                  850,000+ sqm
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Ocean Freight Lanes</span>
                <span className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Ship className="w-5 h-5 text-primary-500" />
                  150+ Direct Routes
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Air Cargo Capacity</span>
                <span className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Plane className="w-5 h-5 text-primary-500" />
                  5,000+ Tons/Week
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Network Hubs Grid */}
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="space-y-12">
            {regions.map((region, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-950 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary-600" />
                    {region.name}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">{region.description}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Hub Facilities list */}
                  <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Operational Facilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {region.hubs.map((hub, hIdx) => (
                        <div key={hIdx} className="border border-gray-100 rounded-lg p-4 hover:border-primary-100 transition-colors">
                          <h4 className="font-bold text-gray-800 text-sm">{hub.name}</h4>
                          <span className="inline-block mt-2 text-xs bg-gray-50 border border-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded">
                            {hub.type}
                          </span>
                          <div className="mt-2 text-xs text-gray-500">
                            Capacity: <strong className="text-gray-700">{hub.capacity}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Lanes list */}
                  <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-primary-600" />
                      Trade Frequencies & Lanes
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 font-medium">
                      {region.shippingModes.map((mode, mIdx) => (
                        <li key={mIdx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                          {mode}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
