import crypto from 'crypto';

export class UberNotificationDto {
  event_id: string;
  event_time: number;
  event_type: string;
  meta: {
    resource_id: string;
    status: string;
    user_id: string;
  };
  resource_href: string;

  constructor(resourceId?: string) {
    const resId = resourceId || crypto.randomUUID();
    this.event_id = crypto.randomUUID();
    this.event_time = Date.now();
    this.event_type = 'orders.notification';
    this.meta = {
      resource_id: resId,
      status: 'pos.create',
      user_id: crypto.randomUUID()
    };
    this.resource_href = `https://api.uber.com/v2/eats/order/${resId}`;
  }
}

export class UberGetOrderDto {
  [key: string]: any;

  constructor(id?: string) {
    const defaultPayload = {
      "id": "153dd7f1-339d-4619-940c-41894e7611ef",
      "display_id": "84H99",
      "external_reference_id": "order-1234",
      "current_state": "CREATED",
      "store": {
        "id": "921867c4-06bf-4cd3-a80e-0d1275cd861b",
        "name": "The Original Donut Shop",
        "external_reference_id": "store-1234"
      },
      "eater": {
        "first_name": "Larry",
        "last_name": "David",
        "phone": "+1 555-555-5555",
        "phone_code": "416952"
      },
      "cart": {
        "items": [
          {
            "id": "Muffin",
            "title": "Fresh-baked muffin",
            "external_data": "External data for muffin",
            "quantity": 1,
            "price": {
              "unit_price": {
                  "amount": 350,
                  "currency_code": "USD",
                  "formatted_amount": "$3.50"
              },
              "total_price": {
                  "amount": 350,
                  "currency_code": "USD",
                  "formatted_amount": "$3.50"
              },
              "base_unit_price": {
                  "amount": 350,
                  "currency_code": "USD",
                  "formatted_amount": "$3.50"
              },
              "base_total_price": {
                  "amount": 350,
                  "currency_code": "USD",
                  "formatted_amount": "$3.50"
              }
            },
            "selected_modifier_groups": null,
            "eater_id": "63578c8b-9cd2-4c4f-91fc-315f575e6a78"
          },
          {
            "id": "Coffee",
            "title": "Coffee",
            "external_data": "External data for coffee",
            "quantity": 2,
            "price": {
              "unit_price": {
                  "amount": 150,
                  "currency_code": "USD",
                  "formatted_amount": "$1.50"
              },
              "total_price": {
                  "amount": 300,
                  "currency_code": "USD",
                  "formatted_amount": "$3.00"
              },
              "base_unit_price": {
                  "amount": 100,
                  "currency_code": "USD",
                  "formatted_amount": "$1.00"
              },
              "base_total_price": {
                  "amount": 200,
                  "currency_code": "USD",
                  "formatted_amount": "$2.00"
              }
            },
            "selected_modifier_groups": [
              {
                "id": "Cream_and_sugar",
                "title": "Cream and sugar",
                "external_data": "External data for cream and sugar group",
                "selected_items": [
                  {
                    "id": "Cream",
                    "title": "Cream",
                    "external_data": "External data for cream item",
                    "quantity": 1,
                    "price": {
                      "unit_price": {
                          "amount": 50,
                          "currency_code": "USD",
                          "formatted_amount": "$0.50"
                      },
                      "total_price": {
                          "amount": 50,
                          "currency_code": "USD",
                          "formatted_amount": "$0.50"
                      },
                      "base_unit_price": {
                          "amount": 50,
                          "currency_code": "USD",
                          "formatted_amount": "$0.50"
                      },
                      "base_total_price": {
                          "amount": 50,
                          "currency_code": "USD",
                          "formatted_amount": "$0.50"
                      }
                    }
                  }
                ],
                "removed_items": null
              }
            ],
            "eater_id": "63578c8b-9cd2-4c4f-91fc-315f575e6a78"
          }
        ],
        "special_instructions": "Please leave at the door."
      },
      "payment": {
        "charges": {
          "total": {
            "amount": 1399,
            "currency_code": "USD",
            "formatted_amount": "$13.99"
          },
          "sub_total": {
            "amount": 650,
            "currency_code": "USD",
            "formatted_amount": "$6.50"
          },
          "tax": {
            "amount": 52,
            "currency_code": "USD",
            "formatted_amount": "$0.52"
          },
          "total_fee": {
            "amount": 697,
            "currency_code": "USD",
            "formatted_amount": "$6.97"
          },
          "cash_amount_due": {
            "amount": 1399,
            "currency_code": "USD",
            "formatted_amount": "$13.99"
          }
        }
      },
      "placed_at": "2019-05-14T15:16:54-05:00",
      "estimated_ready_for_pickup_at": "2019-05-14T15:36:54-05:00",
      "type": "DELIVERY_BY_UBER",
      "brand": "UBER_EATS"
    };

    Object.assign(this, defaultPayload);
    
    // Inject dynamic UUIDs
    this.id = id || crypto.randomUUID();
    this.placed_at = new Date().toISOString();
  }
}
