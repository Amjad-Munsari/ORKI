import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Artificial delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock random failures (e.g., if phone number is "911" for testing)
    if (body.shipping?.phone === '911') {
      return NextResponse.json(
        { message: 'Payment authorization failed.' },
        { status: 400 }
      )
    }

    // Generate mock order ID
    const orderId = `ORK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order placed successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error during checkout.' },
      { status: 500 }
    )
  }
}
