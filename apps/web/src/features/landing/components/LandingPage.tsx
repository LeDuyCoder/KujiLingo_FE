import React from "react";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Science } from "./Science";
import { Crucible } from "./Crucible";
import { Curriculum } from "./Curriculum";
import { FAQ } from "./FAQ";
import { Cta } from "./Cta";
import { Footer } from "./Footer";

export const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Science />
        <Crucible />
        <Curriculum />
        <FAQ />
        <Cta />
      </main>
      <Footer />
    </div>
  );
};
export default LandingPage;
