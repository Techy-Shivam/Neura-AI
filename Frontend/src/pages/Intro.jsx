import React from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import animationData from "../assets/Anima Bot.json"; 
import "./intro.css";

const Intro = () => {
  const navigate = useNavigate();

  return (
    <div className="intro-container">
      <div className="intro-content">

        <div className="intro-animation">
          <Lottie animationData={animationData} loop={true} />
        </div>

        <h2 className="intro-title">NEURA AI</h2>

        <h1 className="intro-quote">
          "Where technology meets creativity, conversations begin."
        </h1>

        <button
          className="get-started-btn"
          onClick={() => navigate("/login")}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Intro;
