import { render, screen } from "@testing-library/react";
import ProfileEditor from "../src/components/ProfileEditor";

test("renders username input", () => {
  render(<ProfileEditor user={{ username: "gaby" }} onSave={() => {}} />);
  expect(screen.getByDisplayValue("gaby")).toBeInTheDocument();
});
