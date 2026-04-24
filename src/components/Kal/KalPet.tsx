import { Box, Tooltip, IconButton } from "@mui/material";
import { Favorite, FitnessCenter } from "@mui/icons-material";
import { useKalStore } from "./KalStore";
import { useState, useEffect, useRef } from "react";
import KalSvg from "./KalSvg";

const KalPet = () => {
  const { petState, feedPet, exercisePet } = useKalStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<
    "feed" | "exercise" | null
  >(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleFeed = () => {
    feedPet();
    triggerAnimation("feed");
  };

  const handleExercise = () => {
    exercisePet();
    triggerAnimation("exercise");
  };

  // Mouse tracking for pupil movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;

      const svg = svgRef.current;

      // Get SVG bounding box
      const rect = svg.getBoundingClientRect();
      const svgCenterX = rect.left + rect.width / 2;
      const svgCenterY = rect.top + rect.height / 2;

      // Calculate mouse position relative to SVG center
      const mouseX = e.clientX - svgCenterX;
      const mouseY = e.clientY - svgCenterY;

      // Calculate angle and distance
      const angle = Math.atan2(mouseY, mouseX);
      const distance = Math.min(
        Math.sqrt(mouseX * mouseX + mouseY * mouseY) / 30,
        2,
      ); // Max 2px movement

      // Calculate pupil offset
      const pupilX = Math.cos(angle) * distance;
      const pupilY = Math.sin(angle) * distance;

      // Apply transformation to pupils only (white highlights)
      const leftPupil = svg.querySelector("#leftEyePupil");
      const rightPupil = svg.querySelector("#rightEyePupil");

      if (leftPupil) {
        (leftPupil as SVGElement).style.transform =
          `translate(${pupilX}px, ${pupilY}px)`;
      }
      if (rightPupil) {
        (rightPupil as SVGElement).style.transform =
          `translate(${pupilX}px, ${pupilY}px)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const triggerAnimation = (type: "feed" | "exercise") => {
    setIsAnimating(true);
    setAnimationType(type);
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationType(null);
    }, 1000);
  };

  const getAnimationStyle = () => {
    if (!isAnimating) return {};

    if (animationType === "feed") {
      return {
        animation: "bounce 0.5s ease-in-out 2",
      };
    } else if (animationType === "exercise") {
      return {
        animation: "shake 0.5s ease-in-out 2",
      };
    }
    return {};
  };

  const getPetMood = () => {
    if (petState.happiness > 80) return "😊";
    if (petState.happiness > 60) return "🙂";
    if (petState.happiness > 40) return "😐";
    if (petState.happiness > 20) return "😞";
    return "😢";
  };

  const getHealthIndicator = () => {
    if (petState.health > 80) return "💚";
    if (petState.health > 60) return "💛";
    if (petState.health > 40) return "🧡";
    return "❤️";
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        p: 3,
      }}
    >
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0,0,0);
            }
            40%, 43% {
              transform: translate3d(0,-30px,0);
            }
            70% {
              transform: translate3d(0,-15px,0);
            }
            90% {
              transform: translate3d(0,-4px,0);
            }
          }
          
          @keyframes shake {
            10%, 90% {
              transform: translate3d(-1px, 0, 0);
            }
            20%, 80% {
              transform: translate3d(2px, 0, 0);
            }
            30%, 50%, 70% {
              transform: translate3d(-4px, 0, 0);
            }
            40%, 60% {
              transform: translate3d(4px, 0, 0);
            }
          }
        `}
      </style>

      {/* Pet Status */}
      <Box sx={{ textAlign: "center" }}>
        <Box sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          {petState.name} - Level {petState.level}
        </Box>
        <Box sx={{ fontSize: "2rem", mt: 1 }}>
          {getPetMood()} {getHealthIndicator()}
        </Box>
        <Box sx={{ fontSize: "0.9rem", color: "text.secondary", mt: 1 }}>
          Happiness: {Math.round(petState.happiness)}% | Health:{" "}
          {Math.round(petState.health)}%
        </Box>
      </Box>

      {/* Pet SVG Display */}
      <Box
        sx={{
          width: 300,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "transform 0.2s ease",
          "&:hover": {
            transform: "scale(1.05)",
          },
          ...getAnimationStyle(),
        }}
        onClick={() => triggerAnimation("feed")}
      >
        <Box
          sx={{
            width: `${petState.size * 100}%`,
            height: `${petState.size * 100}%`,
            maxWidth: "280px",
            maxHeight: "280px",
            position: "relative",
          }}
        >
          <KalSvg ref={svgRef} />
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Tooltip title="Feed Kal (+10 Happiness, +5 Health)">
          <IconButton
            onClick={handleFeed}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
            size="large"
          >
            <Favorite />
          </IconButton>
        </Tooltip>

        <Tooltip title="Exercise with Kal (+15 Experience, +15 Happiness)">
          <IconButton
            onClick={handleExercise}
            sx={{
              bgcolor: "secondary.main",
              color: "white",
              "&:hover": {
                bgcolor: "secondary.dark",
              },
            }}
            size="large"
          >
            <FitnessCenter />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Experience Bar */}
      <Box sx={{ width: "100%", maxWidth: 300 }}>
        <Box sx={{ fontSize: "0.9rem", color: "text.secondary", mb: 1 }}>
          Experience: {petState.experience % 100}/100 (Level {petState.level})
        </Box>
        <Box
          sx={{
            width: "100%",
            height: 8,
            bgcolor: "grey.200",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${petState.experience % 100}%`,
              height: "100%",
              bgcolor: "primary.main",
              transition: "width 0.3s ease",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default KalPet;
