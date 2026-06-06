(function () {
  window.CF = window.CF || {};

  let canvas;
  let ctx;
  let confetti = [];

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function updateConfetti() {
    if (!canvas || canvas.style.display !== 'block') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach(function (piece) {
      piece.y += piece.speed;
      piece.x += Math.sin(piece.angle) * 2;
      piece.angle += 0.08;
      ctx.fillStyle = piece.color;
      ctx.fillRect(piece.x, piece.y, piece.size, piece.size);
      if (piece.y > canvas.height) piece.y = -10;
    });
    requestAnimationFrame(updateConfetti);
  }

  function startConfetti() {
    if (!canvas) return;
    canvas.style.display = 'block';
    confetti = Array.from({ length: 150 }, function () {
      return {
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        size: Math.random() * 10 + 5,
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 6.2
      };
    });
    requestAnimationFrame(updateConfetti);
  }

  function init() {
    canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  CF.Confetti = {
    init: init,
    start: startConfetti
  };
}());
