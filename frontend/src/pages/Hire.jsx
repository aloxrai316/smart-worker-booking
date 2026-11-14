import InfoPage from './InfoPage.jsx';

export default function Hire() {
  return (
    <InfoPage
      badge="For customers"
      title="Do you need a worker?"
      intro="Find skilled, verified local workers for your home — electricians, plumbers, painters, cleaners and more — and book them in a few clicks, without calling around."
      help={[
        ['Find the right person fast', 'Search by service or name and compare profiles, experience and ratings in one place.'],
        ['Workers near you', 'Share your location to see which workers are closest to your home.'],
        ['Safe and verified', 'Every worker is checked by an admin, and your address is shared only after your booking is paid.'],
        ['Clear process', 'Track your booking from request to completion and see your full booking history.'],
        ['Honest reviews', 'Rate the service after the job so other customers can choose with confidence.'],
        ['Help when needed', 'Report any problem and our admin team will look into it.'],
      ]}
      steps={[
        ['Register / Log in', 'Create your customer account.'],
        ['Search & select', 'Browse services, compare profiles and ratings.'],
        ['Submit request', 'Enter your phone, address and pin your location on the map.'],
        ['Worker is notified', 'The worker receives your booking alert.'],
        ['Accept within 10 min', 'The worker must accept or reject. A rejection ends the request.'],
        ['Pay Rs. 100', 'Pay the booking charge and your booking is confirmed.'],
        ['Worker visits', 'The worker comes to your location and completes the service.'],
        ['Rate & review', 'Share your feedback about the work.'],
      ]}
      facts={{ hl: [4, 5], items: [
        ['10 min', 'Response window', 'The worker must accept or reject your request.'],
        ['Rs. 100', 'Booking charge', 'Paid only after the worker accepts.'],
        ['Verified', 'Details protected', 'The worker sees your address only after payment.'],
      ] }}
      primary={{ to: '/register?role=customer', label: 'Sign up to hire a worker' }}
      secondary={{ to: '/login?role=customer', label: 'Customer login' }}
      other={{ to: '/work', label: 'Looking for work instead?' }}
    />
  );
}
