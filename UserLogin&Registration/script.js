document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('regForm');

    const setError = (input, msgElement, message) => {
        if (message) {
            input.classList.add('is-invalid-input');
            msgElement.innerText = message;
        } else {
            input.classList.remove('is-invalid-input');
            msgElement.innerText = "";
        }
    };

    //toggle for pass
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

    //login page
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

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // stop invalid submission
            
            const emailStatus = isEmailValid(emailIn.value);
            const passStatus = passIn.value.length > 0;

            // pass is "Admin123"
            if (emailStatus !== "ok") setError(emailIn, emailErr, emailStatus === "required" ? "Email is required." : "Invalid email format.");
            if (!passStatus) setError(passIn, passErr, "Password is required.");

            if (emailStatus === "ok" && passStatus) {
                if (passIn.value !== "Admin123") {
                    setError(passIn, passErr, "Invalid email or password.");
                    setError(emailIn, emailErr, " "); // Border only
                } else {
                    alert("Login Successful!");
                }
            }
        });
    }

    //registration  page 
    if (regForm) {
        const nameIn = document.getElementById('regName');
        const emailIn = document.getElementById('regEmail');
        const passIn = document.getElementById('regPassword');
        const confirmIn = document.getElementById('regConfirmPassword');
        const regBtn = document.getElementById('regBtn');

        const validateRegBtn = () => {
            const nameStatus = isNameValid(nameIn.value);
            const emailStatus = isEmailValid(emailIn.value);
            const passStatus = isPasswordValid(passIn.value);
            const matches = passIn.value === confirmIn.value && confirmIn.value !== "";
            
            regBtn.disabled = !(nameStatus === "ok" && emailStatus === "ok" && passStatus === "ok" && matches);
        };

        nameIn.addEventListener('blur', () => {
            const status = isNameValid(nameIn.value);
            if (status === "required") setError(nameIn, document.getElementById('nameError'), "Name is required.");
            else if (status === "invalid") setError(nameIn, document.getElementById('nameError'), "Letters only, min 3 chars.");
            else setError(nameIn, document.getElementById('nameError'), "");
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
            else if (status === "invalid") setError(passIn, document.getElementById('passError'), "Must be 8+ chars, with 1 Upper, 1 Lower, and 1 Num.");
            else setError(passIn, document.getElementById('passError'), "");
        });

        confirmIn.addEventListener('blur', () => {
            if (confirmIn.value === "") setError(confirmIn, document.getElementById('confirmError'), "Please confirm your password.");
            else if (confirmIn.value !== passIn.value) setError(confirmIn, document.getElementById('confirmError'), "Passwords do not match.");
            else setError(confirmIn, document.getElementById('confirmError'), "");
        });

        [nameIn, emailIn, passIn, confirmIn].forEach(el => el.addEventListener('input', validateRegBtn));

        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!regBtn.disabled) {
                document.getElementById('successMsg').classList.remove('d-none');
                setTimeout(() => { window.location.href = "index.html"; }, 2000);
            }
        });
    }
});