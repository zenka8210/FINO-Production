const EventEmitter = require('events');
const EmailService = require('./emailService');

class BackgroundJobService extends EventEmitter {
  constructor() {
    super();
    this.jobQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    
    console.log('🔧 BackgroundJobService initialized');
    
    // Start processing jobs
    this.startProcessing();
  }

  // Add a job to the queue
  addJob(jobType, jobData) {
    const job = {
      id: Date.now() + Math.random(),
      type: jobType,
      data: jobData,
      attempts: 0,
      createdAt: new Date()
    };
    
    this.jobQueue.push(job);
    console.log(`📋 Added ${jobType} job to queue. Queue length: ${this.jobQueue.length}`);
    
    // Emit event to process jobs if not already processing
    if (!this.isProcessing) {
      this.processJobs();
    }
    
    return job.id;
  }

  // Start continuous job processing
  startProcessing() {
    setInterval(() => {
      if (!this.isProcessing && this.jobQueue.length > 0) {
        this.processJobs();
      }
    }, 2000); // Check every 2 seconds
  }

  // Process jobs in the queue
  async processJobs() {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.jobQueue.length} jobs in queue`);

    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift();
      
      try {
        await this.executeJob(job);
        console.log(`✅ Job ${job.id} (${job.type}) completed successfully`);
      } catch (error) {
        console.error(`❌ Job ${job.id} (${job.type}) failed:`, error.message);
        
        // Retry logic
        job.attempts++;
        if (job.attempts < this.retryAttempts) {
          console.log(`🔄 Retrying job ${job.id} (attempt ${job.attempts}/${this.retryAttempts})`);
          
          // Add back to queue with delay
          setTimeout(() => {
            this.jobQueue.push(job);
          }, this.retryDelay);
        } else {
          console.error(`💀 Job ${job.id} failed after ${this.retryAttempts} attempts`);
        }
      }
    }

    this.isProcessing = false;
    console.log('✅ Background job processing completed');
  }

  // Execute a specific job
  async executeJob(job) {
    console.log(`🔧 Executing job ${job.id} (${job.type})`);
    
    switch (job.type) {
      case 'ORDER_EMAIL':
        await this.processOrderEmail(job.data);
        break;
      
      case 'WELCOME_EMAIL':
        await this.processWelcomeEmail(job.data);
        break;
        
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  // Process order confirmation email
  async processOrderEmail(data) {
    const { email, name, order } = data;
    
    console.log(`📧 Processing order email for: ${email}, Order: ${order.orderCode}`);
    
    try {
      // Create EmailService instance
      const emailService = new EmailService();
      await emailService.sendOrderConfirmationEmail(email, name, order);
      console.log(`✅ Order confirmation email sent to: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send order email to ${email}:`, error.message);
      throw error;
    }
  }

  // Process welcome email
  async processWelcomeEmail(data) {
    const { email, name } = data;
    
    console.log(`📧 Processing welcome email for: ${email}`);
    
    try {
      // Create EmailService instance
      const emailService = new EmailService();
      await emailService.sendWelcomeEmail(email, name);
      console.log(`✅ Welcome email sent to: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
      throw error;
    }
  }

  // Convenience method for queuing order emails
  queueOrderEmail(email, name, order) {
    return this.addJob('ORDER_EMAIL', { email, name, order });
  }

  // Convenience method for queuing welcome emails
  queueWelcomeEmail(email, name) {
    return this.addJob('WELCOME_EMAIL', { email, name });
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.jobQueue.length,
      isProcessing: this.isProcessing,
      jobs: this.jobQueue.map(job => ({
        id: job.id,
        type: job.type,
        attempts: job.attempts,
        createdAt: job.createdAt
      }))
    };
  }
}

// Create and export singleton instance
const backgroundJobService = new BackgroundJobService();
module.exports = backgroundJobService;