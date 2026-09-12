import { expect, test } from "@playwright/test";

test("restores progress, gates preview, and unlocks after mock payment", async ({ page }) => {
  await page.goto("/first-page-brand-palette?flow=2117");
  await page.getByRole("button", { name: "Age: 30-39" }).click();
  await expect(page).toHaveURL(/\/onboarding\?/);

  await page.getByRole("button", { name: "Female" }).click();

  await page.getByRole("spinbutton", { name: "What is your exact age?" }).fill("30");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("spinbutton", { name: "What is your height?" }).fill("165");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("spinbutton", { name: "What is your current weight?" }).fill("70");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("spinbutton", { name: "What weight are you aiming for?" }).fill("62");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await expect(page.getByRole("heading", { name: /Over 110,000 women/ })).toBeVisible();
  await page.getByRole("button", { name: "CONTINUE" }).click();
  await page.getByRole("button", { name: /Mid-sized/ }).click();
  await page.getByRole("button", { name: /Support weight management/ }).click();

  await expect(page.getByRole("heading", { name: "What matters most to you right now?" })).toBeVisible();
  await page.evaluate(() => window.sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "What matters most to you right now?" })).toBeVisible();

  await page.getByRole("button", { name: /Build consistency/ }).click();
  await page.getByRole("button", { name: "Several times a week" }).click();
  await page.getByRole("button", { name: /No current limitations/ }).click();
  await page.getByRole("button", { name: /A mix of sitting and moving/ }).click();

  await page.getByRole("button", { name: "Belly" }).click();
  await page.getByRole("button", { name: "NEXT STEP" }).click();
  await page.getByRole("button", { name: "CONTINUE" }).click();
  await page.getByRole("button", { name: /Balanced and consistent/ }).click();
  await page.getByRole("button", { name: /20 minutes/ }).click();

  await expect(page).toHaveURL(/\/results\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByText("Unlock your full projection")).toBeVisible();
  await expect(page.getByText("••••")).toBeVisible();

  const previewResponse = await page.request.get(`/api/v1/results/${page.url().split("/").pop()}`);
  const previewBody = await previewResponse.json();
  expect(previewBody.access).toBe("preview");
  expect(previewBody.result).not.toHaveProperty("predictionCurve");
  expect(previewBody.result).not.toHaveProperty("recommendedCalories");

  await page.getByRole("button", { name: /Monthly demo plan/ }).click();

  await expect(page.getByText("Plan unlocked")).toBeVisible();
  await expect(page.getByText("Active subscription")).toBeVisible();
  await expect(page.getByText("Unlock your full projection")).toHaveCount(0);

  const sessionId = page.url().split("/").pop();
  const fullResponse = await page.request.get(`/api/v1/results/${sessionId}`);
  const fullBody = await fullResponse.json();
  expect(fullBody.access).toBe("full");
  expect(fullBody.result).toHaveProperty("predictionCurve");
  expect(fullBody.result).toHaveProperty("recommendedCalories");
});
