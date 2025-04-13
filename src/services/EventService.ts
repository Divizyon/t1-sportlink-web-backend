import Event from '../models/Event';

export class EventService {
  static async getPendingEvents(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const events = await Event.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    const total = await Event.countDocuments({ status: 'pending' });

    return {
      events,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getEventById(id: string) {
    return await Event.findById(id).populate('createdBy', 'name email');
  }

  static async updateEventStatus(id: string, status: 'approved' | 'rejected') {
    return await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('createdBy', 'name email');
  }
} 