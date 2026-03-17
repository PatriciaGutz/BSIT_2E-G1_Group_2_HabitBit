<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact - HabitBit</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="css/style.css">
</head>

<body class="d-flex flex-column min-vh-100">

    <nav class="navbar navbar-expand-lg navbar-light custom-navbar">
        <div class="container-fluid">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <img src="images/logo.png" alt="HabitBit Logo" height="40" class="me-2">
                <span class="fw-bold text-white fs-3">HabitBit</span>
            </a>
            <div class="ms-auto">
                <a href="landingabout.php" class="text-white text-decoration-none me-3">About</a>
                <a href="landingservices.php" class="text-white text-decoration-none me-3">Services</a>
                <a href="landingcontact.php" class="text-white text-decoration-none me-3 fw-bold">Contact</a>
            </div>
        </div>
    </nav>

    <!--conatct infos-->
    <main class="flex-fill contact-section py-5">
        <div class="container contact-container">
            <h2 class="mb-4 fw-bold">Contact Us</h2>
            <p class="mb-3">If you have any questions, feel free to send us a message.</p>

            <p class="fs-6 contact-info">
                <span class="me-5">
                    <i class="bi bi-envelope-fill"></i> habitbitofficial@gmail.com
                </span>
                <span>
                    <i class="bi bi-telephone-fill"></i> 09xxxxxxxxx
                </span>
            </p>
            <form id="contactForm">
                <div class="mb-3">
                    <label for="name" class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="name" required>
                </div>
                <div class="mb-3">
                    <label for="contactNumber" class="form-label">Contact Number</label>
                    <input type="tel" class="form-control" id="contactNumber" required>
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email Address</label>
                    <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                    <label for="subject" class="form-label">Subject</label>
                    <input type="text" class="form-control" id="subject" required>
                </div>
                <div class="mb-3">
                    <label for="message" class="form-label">Message</label>
                    <textarea class="form-control" id="message" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn btn-orange-custom">Send Message</button>
            </form>
            <div id="formAlert" class="alert alert-success mt-3 d-none" role="alert"></div>
        </div>
      </main>

    <footer class="py-4 text-center">
        <p class="text-muted small">&copy; 2026 HabitBit. All rights reserved.</p>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
