import { render, screen } from "@testing-library/react";
import AboutPage, { metadata } from "./page";

describe("about page", () => {
  it("has the site title and an About heading", () => {
    expect(metadata.title).toEqual({ absolute: "About · Sanding Space" });
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "About",
    );
    expect(screen.getByText(/library of short essays/)).toBeInTheDocument();
  });
});
