import json

from django.core.management.base import BaseCommand

from apps.shop.models import Hairstyle, Product, Salon


class Command(BaseCommand):
    help = "Seed the database with initial products, hairstyles, and salons."

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        self._seed_products()
        self._seed_hairstyles()
        self._seed_salons()

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))

    def _seed_products(self):
        if Product.objects.exists():
            return
        products = [
            {
                "name": "Aurora Hair Elixir Serum",
                "description": "Premium hair growth serum infused with biotin, argan oil, and caffeine. Stimulates follicles for thicker, fuller hair in just 4 weeks. Dermatologist tested and approved for all hair types.",
                "category": "serum",
                "price": "12500",
                "compare_price": "18000",
                "stock_quantity": 45,
                "sku": "AUR-SER-001",
                "photos": json.dumps(["/product-serum.jpg"]),
                "image": "products/product-serum.jpg",
                "badge": "Best Seller",
                "is_featured": True,
                "average_rating": "4.8",
                "total_reviews": 142,
            },
            {
                "name": "Organic Elixir Shampoo",
                "description": "Sulfate-free shampoo with natural botanical extracts. Gently cleanses while preserving natural oils. Contains shea butter, coconut oil, and aloe vera for deep hydration and scalp health.",
                "category": "shampoo",
                "price": "8500",
                "compare_price": "12000",
                "stock_quantity": 62,
                "sku": "ORG-SHA-002",
                "photos": json.dumps(["/product-shampoo.jpg"]),
                "image": "products/product-shampoo.jpg",
                "is_featured": True,
                "average_rating": "4.6",
                "total_reviews": 98,
            },
            {
                "name": "Nocture Regenerating Mask",
                "description": "Intensive overnight hair treatment mask. Deep conditioning formula repairs damaged hair, restores shine, and prevents breakage. Wake up to silky, manageable hair every morning.",
                "category": "treatment",
                "price": "15000",
                "compare_price": "22000",
                "stock_quantity": 28,
                "sku": "NOC-MSK-003",
                "photos": json.dumps(["/product-treatment.jpg"]),
                "image": "products/product-treatment.jpg",
                "badge": "Top Rated",
                "is_featured": True,
                "is_new": True,
                "average_rating": "4.9",
                "total_reviews": 215,
            },
            {
                "name": "Hair Revitalize Complex",
                "description": "Advanced hair growth supplement with biotin, zinc, saw palmetto, and collagen. Supports healthy hair growth from within. 60 capsules, 30-day supply.",
                "category": "supplement",
                "price": "18000",
                "stock_quantity": 35,
                "sku": "REV-SUP-004",
                "photos": json.dumps(["/product-supplement.jpg"]),
                "image": "products/product-supplement.jpg",
                "is_featured": True,
                "average_rating": "4.7",
                "total_reviews": 87,
            },
            {
                "name": "Rose Gold Styling Set",
                "description": "Premium wide-tooth comb and detangling brush set in luxurious rose gold finish. Gentle on all hair types, reduces breakage and frizz. Ergonomic design for comfortable styling.",
                "category": "tool",
                "price": "9500",
                "compare_price": "14000",
                "stock_quantity": 18,
                "sku": "ROS-SET-005",
                "photos": json.dumps(["/product-tools.jpg"]),
                "image": "products/product-tools.jpg",
                "is_new": True,
                "average_rating": "4.5",
                "total_reviews": 64,
            },
            {
                "name": "Argan Elixir Hair Oil",
                "description": "Pure Moroccan argan oil infused with vitamin E and essential fatty acids. Adds brilliant shine, tames frizz, and protects against heat damage. Lightweight, non-greasy formula.",
                "category": "serum",
                "price": "11000",
                "stock_quantity": 40,
                "sku": "ARG-OIL-006",
                "photos": json.dumps(["/product-oil.jpg"]),
                "image": "products/product-oil.jpg",
                "badge": "Popular",
                "average_rating": "4.8",
                "total_reviews": 176,
            },
            {
                "name": "Aurora Bliss Conditioner",
                "description": "Luxury restorative conditioner with keratin and silk proteins. Detangles, softens, and strengthens hair. pH-balanced formula for optimal hair health and manageability.",
                "category": "treatment",
                "price": "9200",
                "compare_price": "13000",
                "stock_quantity": 55,
                "sku": "AUR-CON-007",
                "photos": json.dumps(["/product-conditioner.jpg"]),
                "image": "products/product-conditioner.jpg",
                "average_rating": "4.6",
                "total_reviews": 112,
            },
            {
                "name": "Aurum Nectar Moisturizer",
                "description": "Leave-in hair moisturizer with honey extract and natural humectants. Provides 24-hour hydration, defines curls, and eliminates dryness. Perfect for natural and protective styles.",
                "category": "treatment",
                "price": "7800",
                "stock_quantity": 48,
                "sku": "AUR-MOI-008",
                "photos": json.dumps(["/product-moisturizer.jpg"]),
                "image": "products/product-moisturizer.jpg",
                "is_new": True,
                "average_rating": "4.7",
                "total_reviews": 93,
            },
            {
                "name": "Opulence Edge Control Gel",
                "description": "Professional-grade edge control gel with extreme hold. Smooths and lays edges without flaking or white residue. Infused with castor oil to promote healthy hairline growth.",
                "category": "other",
                "price": "5500",
                "stock_quantity": 72,
                "sku": "OPU-EDG-009",
                "photos": json.dumps(["/product-edge-control.jpg"]),
                "image": "products/product-edge-control.jpg",
                "badge": "Trending",
                "average_rating": "4.4",
                "total_reviews": 156,
            },
        ]
        Product.objects.bulk_create(Product(**p) for p in products)
        self.stdout.write("Products seeded!")

    def _seed_hairstyles(self):
        if Hairstyle.objects.exists():
            return
        hairstyles = [
            {
                "name": "Golden Box Braids",
                "category": "Braids",
                "gender_target": "female",
                "image": "hairstyles/hairstyle-braids.jpg",
                "face_shapes": json.dumps(["oval", "round", "square", "heart"]),
                "hair_types": json.dumps(["curly", "coily", "kinky"]),
                "trend_score": 95,
            },
            {
                "name": "Low Fade with Waves",
                "category": "Fade",
                "gender_target": "male",
                "image": "hairstyles/hairstyle-fade.jpg",
                "face_shapes": json.dumps(["oval", "round", "square"]),
                "hair_types": json.dumps(["curly", "coily"]),
                "trend_score": 92,
            },
            {
                "name": "Natural Afro Glow",
                "category": "Natural",
                "gender_target": "female",
                "image": "hairstyles/hairstyle-afro.jpg",
                "face_shapes": json.dumps(["oval", "heart", "diamond"]),
                "hair_types": json.dumps(["coily", "kinky"]),
                "trend_score": 88,
            },
            {
                "name": "Knotless Braids",
                "category": "Braids",
                "gender_target": "female",
                "image": "hairstyles/hairstyle-braids.jpg",
                "face_shapes": json.dumps(["oval", "round", "heart"]),
                "hair_types": json.dumps(["curly", "coily", "kinky"]),
                "trend_score": 90,
            },
            {
                "name": "High Top Fade",
                "category": "Fade",
                "gender_target": "male",
                "image": "hairstyles/hairstyle-fade.jpg",
                "face_shapes": json.dumps(["oval", "square", "oblong"]),
                "hair_types": json.dumps(["coily", "kinky"]),
                "trend_score": 85,
            },
        ]
        Hairstyle.objects.bulk_create(Hairstyle(**h) for h in hairstyles)
        self.stdout.write("Hairstyles seeded!")

    def _seed_salons(self):
        if Salon.objects.exists():
            return
        salons = [
            {
                "business_name": "Amaka's Hair Studio",
                "description": "Luxury hair braiding and styling studio specializing in protective styles, knotless braids, and natural hair care.",
                "address": "14 Admiralty Way, Lekki Phase 1",
                "city": "Lagos",
                "state": "Lagos",
                "phone_number": "+234 801 234 5678",
                "is_verified": True,
                "is_active": True,
                "is_featured": True,
                "average_rating": "4.9",
                "total_reviews": 286,
                "seat_capacity": 8,
                "current_occupancy": 6,
                "busy_percentage": 78,
                "image": "salons/salon-interior.jpg",
                "working_hours": {
                    "monday": {"open": "09:00", "close": "20:00"},
                    "tuesday": {"open": "09:00", "close": "20:00"},
                },
            },
            {
                "business_name": "Kings Barbershop",
                "description": "Premium men's grooming lounge offering precision cuts, beard grooming, and hairline restoration services.",
                "address": "22 Adeola Odeku Street, Victoria Island",
                "city": "Lagos",
                "state": "Lagos",
                "phone_number": "+234 802 345 6789",
                "is_verified": True,
                "is_active": True,
                "is_featured": True,
                "average_rating": "4.8",
                "total_reviews": 195,
                "seat_capacity": 6,
                "current_occupancy": 4,
                "busy_percentage": 60,
                "image": "salons/barbershop-interior.jpg",
                "working_hours": {
                    "monday": {"open": "08:00", "close": "21:00"},
                    "tuesday": {"open": "08:00", "close": "21:00"},
                },
            },
        ]
        Salon.objects.bulk_create(Salon(**s) for s in salons)
        self.stdout.write("Salons seeded!")
