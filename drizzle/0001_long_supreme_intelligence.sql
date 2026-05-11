CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`direction` enum('inbound','outbound') NOT NULL,
	`contentType` enum('text','template','interactive_buttons','interactive_list','image','location','document','audio','video') NOT NULL DEFAULT 'text',
	`content` json NOT NULL,
	`timestamp` varchar(20) DEFAULT '12:00 PM',
	`isRead` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uid` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`businessName` varchar(255),
	`businessUrl` varchar(1024),
	`businessContext` text,
	`industry` varchar(100),
	`messageType` enum('marketing','utility','authentication') NOT NULL DEFAULT 'marketing',
	`profileName` varchar(100),
	`profileImageUrl` varchar(1024),
	`isVerified` boolean NOT NULL DEFAULT true,
	`phoneSettings` json,
	`isPublic` boolean NOT NULL DEFAULT false,
	`shareToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `threads_id` PRIMARY KEY(`id`),
	CONSTRAINT `threads_uid_unique` UNIQUE(`uid`)
);
--> statement-breakpoint
CREATE TABLE `use_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`industry` varchar(100) NOT NULL,
	`messageType` enum('marketing','utility','authentication') NOT NULL DEFAULT 'marketing',
	`tags` json,
	`flowSteps` json,
	`sampleMessages` json,
	`isBuiltIn` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `use_cases_id` PRIMARY KEY(`id`)
);
