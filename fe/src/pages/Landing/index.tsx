export default function LandingPage() {
  return (
    <iframe
      src="/landing.html"
      title="Landing"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        zIndex: 9999,
      }}
    />
  );
}
