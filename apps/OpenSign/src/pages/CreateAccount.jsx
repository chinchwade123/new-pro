import React, { useState, useEffect } from "react";
import Parse from "parse";
import { useDispatch } from "react-redux";
import { useNavigate, NavLink } from "react-router-dom";
import Title from "../components/Title";
import login_img from "../assets/images/login_img.svg"; // Consider a different image or none
import { useWindowSize } from "../hook/useWindowSize";
import { emailRegex } from "../constant/const";
import Alert from "../primitives/Alert";
import { appInfo } from "../constant/appinfo";
import { fetchAppInfo } from "../redux/reducers/infoReducer";
import { getAppLogo, saveLanguageInLocal } from "../constant/Utils";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";
import SelectLanguage from "../components/pdf/SelectLanguage";

function CreateAccount() {
  const appName = "OpenSign™";
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { width } = useWindowSize();
  const [state, setState] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    alertType: "success",
    alertMsg: "",
    passwordVisible: false,
    confirmPasswordVisible: false,
    loading: false,
  });
  const [image, setImage] = useState();
  const [errMsg, setErrMsg] = useState();

  useEffect(() => {
    const initialize = async () => {
      const app = await getAppLogo();
      if (app?.error === "invalid_json") {
        setErrMsg(t("server-down", { appName: appName }));
      } else if (app?.user === "not_exist" && !window.location.pathname.includes("/addadmin")) {
        // Allow access if admin needs to be created, otherwise redirect if trying to access signup directly
        // navigate("/addadmin");
      }
      if (app?.logo) {
        setImage(app?.logo);
      } else {
        setImage(appInfo?.applogo || undefined);
      }
      dispatch(fetchAppInfo());
    };
    initialize();
    // eslint-disable-next-line
  }, []);

  const showToast = (type, msg) => {
    setState({ ...state, loading: false, alertType: type, alertMsg: msg });
    setTimeout(() => setState({ ...state, alertMsg: "" }), 3000);
  };

  const handleChange = (event) => {
    let { name, value } = event.target;
    if (name === "email") {
      value = value?.toLowerCase()?.replace(/\s/g, "");
    }
    setState({ ...state, [name]: value });
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    const { fullName, email, password, confirmPassword } = state;

    if (!fullName || !email || !password || !confirmPassword) {
      showToast("danger", t("fill-all-fields", "Please fill all required fields.")); // Added fallback text
      return;
    }
    if (!emailRegex.test(email)) {
      showToast("danger", t("invalid-email-format", "Please enter a valid email address."));
      return;
    }
    if (password !== confirmPassword) {
      showToast("danger", t("passwords-do-not-match", "Passwords do not match."));
      return;
    }
    if (password.length < 6) { // Example: Basic password length validation
        showToast("danger", t("password-too-short", "Password must be at least 6 characters long."));
        return;
    }

    setState({ ...state, loading: true });

    try {
      const params = {
        userDetails: {
          name: fullName,
          email: email,
          password: password,
          role: "contracts_User", // Default role, adjust if necessary
          // company and jobTitle can be collected later or made optional
        },
      };
      // The 'usersignup' cloud function is expected to handle actual user creation in Parse
      const user = await Parse.Cloud.run("usersignup", params);

      if (user && user.id) {
        // New user created in _User table, now create corresponding ExtUser
        // The usersignup function in main.js seems to handle ExtUser creation as well.
        showToast("success", t("account-created-success", "Account created successfully! Please login."));
        setTimeout(() => navigate("/login"), 2000);
      } else if (user && user.error) {
         // Handle specific errors from backend if provided
        showToast("danger", user.message || t("account-creation-failed", "Account creation failed. Please try again."));
      } else {
        showToast("danger", t("account-creation-failed", "Account creation failed. Please try again."));
      }
    } catch (error) {
      console.error("Error creating account:", error);
      // Check for specific Parse error codes if needed
      if (error.code === 202) { // Email already taken
        showToast("danger", t("email-already-taken", "This email address is already registered."));
      } else {
        showToast("danger", error.message || t("something-went-wrong-mssg", "Something went wrong. Please try again."));
      }
    } finally {
      setState({ ...state, loading: false });
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setState({ ...state, passwordVisible: !state.passwordVisible });
    } else if (field === "confirmPassword") {
      setState({ ...state, confirmPasswordVisible: !state.confirmPasswordVisible });
    }
  };

  return errMsg ? (
    <div className="h-screen flex justify-center text-center items-center p-4 text-gray-500 text-base">
      {errMsg}
    </div>
  ) : (
    <div>
      <Title title={t("create-account-title", "Create Account")} />
      {state.loading && (
        <div
          aria-live="assertive"
          className="fixed w-full h-full flex justify-center items-center bg-black bg-opacity-30 z-50"
        >
          <Loader />
        </div>
      )}
      {appInfo && appInfo.appId ? (
        <>
          <div
            aria-labelledby="createAccountHeading"
            role="region"
            className="pb-1 md:pb-4 pt-10 md:px-10 lg:px-16 h-full min-h-screen flex flex-col justify-center"
          >
            <div className="md:p-4 lg:p-10 p-4 bg-base-100 text-base-content op-card max-w-4xl mx-auto w-full">
              <div className="flex justify-center md:justify-start w-full">
                <div className="w-[200px] h-[50px] inline-block overflow-hidden mb-6">
                  {image && (
                    <img
                      src={image}
                      className="object-contain h-full w-full"
                      alt="applogo"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div className="flex flex-col justify-center">
                  <form onSubmit={handleCreateAccount} aria-label="Create Account Form">
                    <h1 id="createAccountHeading" className="text-[28px] md:text-[30px] mt-0 mb-2 text-center md:text-left">
                      {t("create-your-account", "Create Your Account")}
                    </h1>
                    <p className="text-[12px] text-[#878787] mb-6 text-center md:text-left">
                      {t("start-your-journey", "Start your journey with OpenSign™.")}
                    </p>

                    <fieldset className="space-y-4">
                      <div>
                        <label className="block text-xs mb-1" htmlFor="fullName">
                          {t("full-name", "Full Name")}
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                          name="fullName"
                          value={state.fullName}
                          onChange={handleChange}
                          required
                          onInvalid={(e) => e.target.setCustomValidity(t("input-required", "This field is required."))}
                          onInput={(e) => e.target.setCustomValidity("")}
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1" htmlFor="email">
                          {t("email", "Email Address")}
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                          name="email"
                          autoComplete="username"
                          value={state.email}
                          onChange={handleChange}
                          required
                          onInvalid={(e) => e.target.setCustomValidity(t("invalid-email-format", "Please enter a valid email."))}
                          onInput={(e) => e.target.setCustomValidity("")}
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1" htmlFor="password">
                          {t("password", "Password")}
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type={state.passwordVisible ? "text" : "password"}
                            className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                            name="password"
                            value={state.password}
                            autoComplete="new-password"
                            onChange={handleChange}
                            required
                            onInvalid={(e) => e.target.setCustomValidity(t("input-required", "This field is required."))}
                            onInput={(e) => e.target.setCustomValidity("")}
                          />
                          <span
                            className="absolute cursor-pointer top-[50%] right-[10px] -translate-y-[50%] text-base-content"
                            onClick={() => togglePasswordVisibility("password")}
                          >
                            {state.passwordVisible ? (
                              <i className="fa-light fa-eye-slash text-xs pb-1" />
                            ) : (
                              <i className="fa-light fa-eye text-xs pb-1 " />
                            )}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs mb-1" htmlFor="confirmPassword">
                          {t("confirm-password", "Confirm Password")}
                        </label>
                        <div className="relative">
                          <input
                            id="confirmPassword"
                            type={state.confirmPasswordVisible ? "text" : "password"}
                            className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                            name="confirmPassword"
                            value={state.confirmPassword}
                            autoComplete="new-password"
                            onChange={handleChange}
                            required
                            onInvalid={(e) => e.target.setCustomValidity(t("input-required", "This field is required."))}
                            onInput={(e) => e.target.setCustomValidity("")}
                          />
                          <span
                            className="absolute cursor-pointer top-[50%] right-[10px] -translate-y-[50%] text-base-content"
                            onClick={() => togglePasswordVisibility("confirmPassword")}
                          >
                            {state.confirmPasswordVisible ? (
                              <i className="fa-light fa-eye-slash text-xs pb-1" />
                            ) : (
                              <i className="fa-light fa-eye text-xs pb-1 " />
                            )}
                          </span>
                        </div>
                      </div>
                    </fieldset>

                    <div className="mt-6">
                      <button
                        type="submit"
                        className="op-btn op-btn-primary w-full"
                        disabled={state.loading}
                      >
                        {state.loading ? t("creating-account", "Creating Account...") : t("create-account-btn", "Create Account")}
                      </button>
                    </div>
                    <div className="text-center mt-4 text-xs">
                        <NavLink
                            to="/login"
                            className="op-link op-link-primary underline-offset-1 focus:outline-none"
                        >
                            {t("already-have-account", "Already have an account? Login")}
                        </NavLink>
                    </div>
                  </form>
                </div>
                {width >= 768 && (
                  <div className="hidden md:flex items-center justify-center">
                    <div className="mx-auto md:w-[300px] lg:w-[350px] xl:w-[400px]">
                      <img
                        src={login_img} // Consider a more relevant image for account creation
                        alt={t("create-account-alt-img", "Illustration for account creation page")}
                        width="100%"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-auto"> {/* Pushes SelectLanguage to the bottom */}
             <SelectLanguage />
            </div>
            {state.alertMsg && (
              <Alert type={state.alertType}>{state.alertMsg}</Alert>
            )}
          </div>
        </>
      ) : (
        <div
          aria-live="assertive"
          className="fixed w-full h-full flex justify-center items-center z-50"
        >
          <Loader />
        </div>
      )}
    </div>
  );
}
export default CreateAccount;
