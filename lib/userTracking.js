import { createServerSupabaseClient } from './supabase'

// Track user actions for analytics
export async function trackUserAction(userId, action, metadata = {}) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('user_actions')
      .insert({
        user_id: userId,
        action,
        metadata,
        timestamp: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error tracking user action:', error)
    }
  } catch (error) {
    console.error('Error tracking user action:', error)
  }
}

// Get user statistics
export async function getUserStats(userId) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get resume count
    const { data: resumes, error: resumeError } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', userId)
    
    // Get action count by type
    const { data: actions, error: actionError } = await supabase
      .from('user_actions')
      .select('action')
      .eq('user_id', userId)
    
    if (resumeError || actionError) {
      throw new Error('Error fetching user stats')
    }
    
    const actionCounts = actions.reduce((acc, { action }) => {
      acc[action] = (acc[action] || 0) + 1
      return acc
    }, {})
    
    return {
      resumeCount: resumes?.length || 0,
      actionCounts,
      totalActions: actions?.length || 0
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return { resumeCount: 0, actionCounts: {}, totalActions: 0 }
  }
}

// Update user profile
export async function updateUserProfile(userId, updates) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (error) {
      throw error
    }
    
    return data[0]
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
} 