<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Services - HabitBit</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light custom-navbar">
        <div class="container-fluid">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <img src="images/logo.png" alt="HabitBit Logo" height="45" class="me-2">
                <span class="fw-bold text-white fs-2">HabitBit</span>
            </a>
            <div class="ms-auto">
                <a href="landingabout.php" class="text-white text-decoration-none me-3">About</a>
                <a href="landingservices.php" class="text-white text-decoration-none me-3 fw-bold">Services</a>
                <a href="landingcontact.php" class="text-white text-decoration-none me-3">Contact</a>
            </div>
        </div>
    </nav>

    <header class="services-header text-center">
        <div class="container">
            <h1 class="display-5 fw-bold">OUR SERVICES</h1>
            <p class="lead text-muted">Building better habits, one bit at a time.</p>
            <div class="header-line"></div>
        </div>
    </header>

    <main class="container py-5">
        <div class="row g-4 justify-content-center">
            <div class="col-md-6 col-lg-3">
                <div class="service-card hb-green">
                    <div class="service-icon"><i class="bi bi-calendar-check"></i></div>
                    <h3>Habit Tracking</h3>
                    <p>Log your daily progress with an easy-to-use interface designed for consistency.</p>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="service-card hb-orange">
                    <div class="service-icon"><i class="bi bi-chat-quote"></i></div>
                    <h3>Daily Quotes</h3>
                    <p>Receive daily scriptures and motivational quotes to keep you inspired every day.</p>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="service-card hb-blue">
                    <div class="service-icon"><i class="bi bi-grid-3x3"></i></div>
                    <h3>Progress Grids</h3>
                    <p>Visualize your growth with monthly and yearly habit tracking calendars.</p>
                </div>
            </div>

            <div class="col-md-6 col-lg-3">
                <div class="service-card hb-peach">
                    <div class="service-icon"><i class="bi bi-fire"></i></div>
                    <h3>Login Streaks</h3>
                    <p>Stay motivated with a streak system that tracks your consecutive active days.</p>
                </div>
            </div>
        </div>

        <div class="text-center mt-5">
            <a href="index.php" class="btn btn-start btn-lg px-5 rounded-pill">Start Your Journey</a>
        </div>
    </main>

    <footer class="py-4 text-center">
        <p class="text-muted small">&copy; 2026 HabitBit. All rights reserved.</p>
    </footer>
</body>
</html>