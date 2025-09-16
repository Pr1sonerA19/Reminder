document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('inputForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Submit');
  });
});
