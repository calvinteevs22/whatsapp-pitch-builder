CREATE TABLE `saved_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`industry` varchar(100),
	`messageType` enum('marketing','utility','authentication') NOT NULL DEFAULT 'marketing',
	`profileName` varchar(100),
	`businessContext` text,
	`messagesSnapshot` json,
	`tags` json,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_templates_id` PRIMARY KEY(`id`)
);
