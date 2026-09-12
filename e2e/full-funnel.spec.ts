import { expect, test } from "@playwright/test";

test("walks the explicit route funnel, restores from backend, and unlocks via mock checkout", async ({ page }) => {
  await page.goto("/first-page-brand-palette?flow=2117");
  await page.getByRole("button", { name: "Age: 30-39" }).click();
  await expect(page).toHaveURL(/\/onboarding\/intro\?/);

  await page.getByRole("button", { name: "CONTINUE" }).click();
  await expect(page).toHaveURL(/\/onboarding\/physical-build\?/);
  await page.getByRole("button", { name: "Mid-sized" }).click();
  await page.getByRole("button", { name: "Support weight management" }).click();
  await page.getByRole("button", { name: "Several times a week" }).click();

  await expect(page).toHaveURL(/\/onboarding\/stairs\?/);
  await page.getByRole("button", { name: "Slightly, I still can talk" }).click();
  await expect(page).toHaveURL(/\/onboarding\/limitations\?/);

  await page.getByRole("button", { name: "Sensitive knees" }).click();
  await page.getByRole("button", { name: "NEXT", exact: true }).click();
  await page.getByRole("button", { name: "3-4 times a week" }).click();

  await page.getByRole("button", { name: "No, never tried it" }).click();
  await expect(page).toHaveURL(/\/onboarding\/accessories-barrier\?/);
  await page.getByRole("button", { name: "I prefer bodyweight exercises" }).click();
  await page.getByRole("button", { name: "CONTINUE" }).click();
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("button", { name: "9 to 5" }).click();
  await page.getByRole("button", { name: "I take active breaks" }).click();

  await expect(page).toHaveURL(/\/onboarding\/energy\?/);
  await page.evaluate(() => window.sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "How are your energy levels during the day?" })).toBeVisible();

  await page.getByRole("button", { name: "High and steady" }).click();
  await page.getByRole("button", { name: "2 to 6 glasses" }).click();
  await page.getByRole("button", { name: "7-8 hours" }).click();
  await page.getByRole("button", { name: "Between 8 and 10 am" }).click();
  await page.getByRole("button", { name: "Between noon and 2 pm" }).click();
  await page.getByRole("button", { name: "Between 6 and 8 pm" }).click();
  await page.getByRole("button", { name: /Mediterranean/ }).click();

  await page.getByRole("button", { name: "I have a sweet tooth" }).click();
  await page.getByRole("button", { name: "NEXT", exact: true }).click();
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("button", { name: "Stress or worry" }).click();
  await page.getByRole("button", { name: "NEXT", exact: true }).click();
  await page.getByRole("button", { name: "Female" }).click();

  await expect(page).toHaveURL(/\/onboarding\/height\?/);
  await page.getByRole("spinbutton", { name: "Height in centimeters" }).fill("165");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("spinbutton", { name: "Weight in KG" }).fill("70");
  await expect(page.getByText("26", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("spinbutton", { name: "Goal weight in KG" }).fill("62");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("spinbutton", { name: "Age in years" }).fill("30");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await expect(page).toHaveURL(/\/onboarding\/wellness-profile\?/, { timeout: 8_000 });
  await expect(page.getByRole("heading", { name: "Here's your wellness profile" })).toBeVisible();
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await page.getByRole("button", { name: "No events any time soon" }).click();
  await expect(page).toHaveURL(/\/onboarding\/goal-projection\?/);
  await page.getByRole("button", { name: "CONTINUE" }).click();
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await expect(page).toHaveURL(/\/onboarding\/email\?/, { timeout: 8_000 });
  await page.getByRole("textbox", { name: "Email" }).fill("demo@example.com");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await expect(page).toHaveURL(/\/funnel-prompts\?/);
  await page.getByRole("textbox", { name: "Name" }).fill("Demo");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await expect(page).toHaveURL(/\/progress-graph\/default\?/);
  await expect(page.getByRole("heading", { name: /Demo, your 4-week Home Pilates Workout Plan is ready!/ })).toBeVisible();
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await expect(page).toHaveURL(/\/country-change\?/);
  await page.getByRole("button", { name: "Yes, I am" }).click();
  await expect(page).toHaveURL(/\/scratch-card\?/);
  await page.getByRole("button", { name: "Reveal special discount" }).click();
  await expect(page.getByText("30% OFF")).toBeVisible();
  await page.getByRole("button", { name: "CONTINUE" }).click();

  await expect(page).toHaveURL(/\/checkout\/reason-to-believe\?/);
  await expect(page.getByRole("heading", { name: "Your Home Pilates Workout Plan is ready!" })).toBeVisible();
  await page.getByRole("button", { name: "GET MY PLAN" }).nth(1).click();
  await expect(page.getByRole("dialog", { name: "Complete your checkout" })).toBeVisible();
  await expect(page.getByText("Card number field intentionally disabled — simulated payment only")).toBeVisible();

  const sessionId = new URL(page.url()).searchParams.get("sessionId");
  expect(sessionId).toBeTruthy();

  const completeResponse = await page.request.post(`/api/v1/sessions/${sessionId}/complete`);
  expect(completeResponse.ok()).toBeTruthy();

  const previewResponse = await page.request.get(`/api/v1/results/${sessionId}`);
  const previewBody = await previewResponse.json();
  expect(previewBody.access).toBe("preview");
  expect(previewBody.result).not.toHaveProperty("targetDate");
  expect(previewBody.result).not.toHaveProperty("predictionCurve");
  expect(previewBody.result).not.toHaveProperty("recommendedCalories");

  await page.getByRole("button", { name: "GET MY PLAN — SIMULATED" }).click();
  await expect(page).toHaveURL(new RegExp(`/results/${sessionId}$`), { timeout: 10_000 });
  await expect(page.getByText("Plan unlocked")).toBeVisible();
  await expect(page.getByText("Active subscription")).toBeVisible();

  const fullResponse = await page.request.get(`/api/v1/results/${sessionId}`);
  const fullBody = await fullResponse.json();
  expect(fullBody.access).toBe("full");
  expect(fullBody.result).toHaveProperty("targetDate");
  expect(fullBody.result).toHaveProperty("predictionCurve");
  expect(fullBody.result).toHaveProperty("recommendedCalories");
});
