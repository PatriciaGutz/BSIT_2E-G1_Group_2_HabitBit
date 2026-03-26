document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('regForm');

    const setError = (input, msgElement, message) => {
        if (message) {
            input.classList.add('is-invalid');
            msgElement.innerText = message;
        } else {
            input.classList.remove('is-invalid');
            msgElement.innerText = "";
        }
    };

    const setupToggle = (toggleId, inputId) => {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (toggle && input) {
            toggle.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password';
                toggle.classList.toggle('bi-eye');
                toggle.classList.toggle('bi-eye-slash');
            });
        }
    };

    setupToggle('toggleLoginPass', 'loginPassword');
    setupToggle('toggleRegPass', 'regPassword');
    setupToggle('toggleConfirmPass', 'regConfirmPassword');

    function isEmailValid(email) {
        if (email.trim() === "") return "required";
        const isValid = email.includes("@") && email.includes(".") && email.indexOf("@") < email.lastIndexOf(".");
        return isValid ? "ok" : "invalid";
    }

    function isPasswordValid(pass) {
        if (pass.length === 0) return "required";
        const hasUpper = pass !== pass.toLowerCase();
        const hasLower = pass !== pass.toUpperCase();
        let hasNum = false;
        for (let char of pass) { if (char >= '0' && char <= '9') hasNum = true; }
        const isValid = pass.length >= 8 && hasUpper && hasLower && hasNum;
        return isValid ? "ok" : "invalid";
    }

    function isNameValid(name) {
        if (name.trim() === "") return "required";
        if (name.length < 3) return "invalid";
        for (let char of name) {
            if (!((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') || char === ' ')) return "invalid";
        }
        return "ok";
    }

    /* --Login page logic-- */
    if (loginForm) {
        const emailIn = document.getElementById('loginEmail');
        const passIn = document.getElementById('loginPassword');
        const loginBtn = document.getElementById('loginBtn');
        const emailErr = document.getElementById('loginEmailError');
        const passErr = document.getElementById('loginPassError');

        const validateLoginBtn = () => {
            const emailStatus = isEmailValid(emailIn.value);
            const passStatus = passIn.value.length > 0;
            loginBtn.disabled = !(emailStatus === "ok" && passStatus);
        };

        emailIn.addEventListener('blur', () => {
            const status = isEmailValid(emailIn.value);
            if (status === "required") setError(emailIn, emailErr, "Email is required.");
            else if (status === "invalid") setError(emailIn, emailErr, "Invalid email format.");
            else setError(emailIn, emailErr, "");
        });

        passIn.addEventListener('blur', () => {
            if (passIn.value.length === 0) setError(passIn, passErr, "Password is required.");
            else setError(passIn, passErr, "");
        });

        [emailIn, passIn].forEach(el => el.addEventListener('input', validateLoginBtn));

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const formData = {
                    email: emailIn.value,
                    password: passIn.value
                };

                const response = await fetch('/BSIT_2E-G1_Group_2_HabitBit/api/login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = "dashboard.php";
                } else {
                    setError(emailIn, emailErr, result.error || "Invalid credentials");
                    setError(passIn, passErr, result.error || "Invalid credentials");
                }
            } catch (error) {
                setError(emailIn, emailErr, "Network error. Check server.");
            }
        });
    }

    /* --Register page logic-- */
    if (regForm) {
        const nameIn = document.getElementById('regFName');
        const lastNameIn = document.getElementById('regLName'); // Fixed ID
        const emailIn = document.getElementById('regEmail');
        const passIn = document.getElementById('regPassword');
        const confirmIn = document.getElementById('regConfirmPassword');
        const regBtn = document.getElementById('regBtn');

        const validateRegBtn = () => {
            const FnameStatus = isNameValid(nameIn.value);
            const LNameStatus = isNameValid(lastNameIn.value);
            const emailStatus = isEmailValid(emailIn.value);
            const passStatus = isPasswordValid(passIn.value);
            const matches = passIn.value === confirmIn.value && confirmIn.value !== "";
            
            regBtn.disabled = !(FnameStatus === "ok" && LNameStatus === "ok" && emailStatus === "ok" && passStatus === "ok" && matches);
        };

        nameIn.addEventListener('blur', () => {
            const status = isNameValid(nameIn.value);
            if (status === "required") setError(nameIn, document.getElementById('nameError'), "First Name is required.");
            else if (status === "invalid") setError(nameIn, document.getElementById('nameError'), "Letters only, min 3 chars.");
            else setError(nameIn, document.getElementById('nameError'), "");
        });

        lastNameIn.addEventListener('blur', () => {
            const status = isNameValid(lastNameIn.value);
            if (status === "required") setError(lastNameIn, document.getElementById('lastNameError'), "Last Name is required.");
            else if (status === "invalid") setError(lastNameIn, document.getElementById('lastNameError'), "Letters only, min 3 chars.");
            else setError(lastNameIn, document.getElementById('lastNameError'), "");
        });

        emailIn.addEventListener('blur', () => {
            const status = isEmailValid(emailIn.value);
            if (status === "required") setError(emailIn, document.getElementById('emailError'), "Email is required.");
            else if (status === "invalid") setError(emailIn, document.getElementById('emailError'), "Invalid email format.");
            else setError(emailIn, document.getElementById('emailError'), "");
        });

        passIn.addEventListener('blur', () => {
            const status = isPasswordValid(passIn.value);
            if (status === "required") setError(passIn, document.getElementById('passError'), "Password is required.");
            else if (status === "invalid") setError(passIn, document.getElementById('passError'), "Must be 8+ chars, 1 Upper, 1 Lower, 1 Num.");
            else setError(passIn, document.getElementById('passError'), "");
        });

        confirmIn.addEventListener('blur', () => {
            if (confirmIn.value === "") setError(confirmIn, document.getElementById('confirmError'), "Please confirm your password.");
            else if (confirmIn.value !== passIn.value) setError(confirmIn, document.getElementById('confirmError'), "Passwords do not match.");
            else setError(confirmIn, document.getElementById('confirmError'), "");
        });

        [nameIn, lastNameIn, emailIn, passIn, confirmIn].forEach(el => el.addEventListener('input', validateRegBtn));

        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!regBtn.disabled) {
                try {
                    const formData = {
                        firstName: nameIn.value,
                        lastName: lastNameIn.value,
                        email: emailIn.value,
                        password: passIn.value
                    };

                    const response = await fetch('/BSIT_2E-G1_Group_2_HabitBit/api/register.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();

                    if (result.success) {
                        document.getElementById('successMsg').classList.remove('d-none');
                        setTimeout(() => { window.location.href = "dashboard.php"; }, 2000);
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Registration failed',
                            text: result.error || 'Please try again',
                            confirmButtonColor: '#ffb347'
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Network error',
                        text: 'Check if server is running',
                        confirmButtonColor: '#ffb347'
                    });
                }
            }
        });
    }

});
