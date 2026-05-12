ALTER TABLE `users` ADD `plan` enum('free','pro','agency') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `genCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `genResetAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','canceled','past_due','trialing');--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifyToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiresAt` timestamp;