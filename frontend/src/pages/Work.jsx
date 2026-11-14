import InfoPage from './InfoPage.jsx';

export default function Work() {
  return (
    <InfoPage
      badge="For workers"
      title="Do you need work?"
      intro="Join as a skilled worker and get booking requests from customers near you. Build a trusted profile, choose the jobs you accept and grow your reputation."
      help={[
        ['Get jobs without searching', 'Customers find you through your profile and send booking requests directly to you.'],
        ['Show your skills', 'Add your photo, specialization, experience and service details so customers can trust you.'],
        ['You stay in control', 'Accept or reject every request, and set yourself as available or busy at any time.'],
        ['Customers close to you', 'Pin your service location so nearby customers can find you first.'],
        ['Protected bookings', 'Customers pay the booking charge before you receive their phone number and address.'],
        ['Grow with ratings', 'Every completed job can earn a review that brings you more work.'],
      ]}
      steps={[
        ['Create a worker account', 'Sign up and choose your service category.'],
        ['Complete your profile', 'Add your photo, skills, experience and location.'],
        ['Get verified', 'An admin reviews and verifies your profile.'],
        ['Receive booking alerts', 'New requests appear on your dashboard.'],
        ['Accept within 10 min', 'Respond in time, otherwise the request expires.'],
        ['Customer pays Rs. 100', 'You then see their phone, address and map pin.'],
        ['Visit and complete the job', 'Update the status: start work, then mark completed.'],
        ['Receive a rating', 'The customer reviews your work.'],
      ]}
      facts={{ hl: [4, 5], items: [
        ['10 min', 'To respond', 'Accept or reject each new request quickly.'],
        ['Rs. 100', 'Paid first', 'Customers pay the booking charge after you accept.'],
        ['Verified', 'Trusted profile', 'Verified workers appear in customer searches.'],
      ] }}
      primary={{ to: '/register?role=worker', label: 'Sign up as a worker' }}
      secondary={{ to: '/login?role=worker', label: 'Worker login' }}
      other={{ to: '/hire', label: 'Need a worker instead?' }}
    />
  );
}
