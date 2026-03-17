<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - HabitBit</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="css/landingstyle.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light custom-navbar">
        <div class="container-fluid">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <img src="images/logo.png" alt="HabitBit Logo" height="45" class="me-2">
                <span class="fw-bold text-white fs-2">HabitBit</span>
            </a>
        </div>
    </nav>

    <div class="container auth-container">
        <div class="card">
            <h2 class="fw-bold text-center mb-4">Create Account</h2>
            <form id="regForm" novalidate>
                <div class="mb-3">
                    <label class="form-label fw-semibold">First Name *</label>
                    <input type="text" id="regFName" class="form-control" placeholder="ex.Juan">
                    <span id="nameError" class="error-msg"></span>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Last Name *</label>
                    <input type="text" id="regLName" class="form-control" placeholder="ex.Dela Cruz">
                    <span id="lastNameError" class="error-msg"></span>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Email Address *</label>
                    <input type="email" id="regEmail" class="form-control" placeholder="juan@example.com">
                    <span id="emailError" class="error-msg"></span>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Password *</label>
                    <div class="password-wrapper">
                        <input type="password" id="regPassword" class="form-control" placeholder="Min. 8 characters">
                        <i class="bi bi-eye-slash toggle-password" id="toggleRegPass"></i>
                    </div>
                    <span id="passError" class="error-msg"></span>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Confirm Password *</label>
                    <div class="password-wrapper">
                        <input type="password" id="regConfirmPassword" class="form-control" placeholder="Repeat password">
                        <i class="bi bi-eye-slash toggle-password" id="toggleConfirmPass"></i>
                    </div>
                    <span id="confirmError" class="error-msg"></span>
                </div>
                <button type="submit" id="regBtn" class="btn btn-habitbit w-100" disabled>Register</button>
            </form>
            <div id="successMsg" class="alert alert-success mt-3 d-none">✅ Registration successful!</div>
            <p class="text-center small mt-3">Already have an account? <a href="login.php" class="text-decoration-none text-orange fw-bold">Login here</a></p>
        </div>
    </div>
    <script src="js/landingscript.js"></script>
</body>
</html>