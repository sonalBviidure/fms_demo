from django.db import models
from django.contrib.auth.models import User


class FarmerProfile(models.Model):
    """
    Farmer Profile model extending Django's built-in User.
    Stores agricultural domain fields: phone number, village/district location,
    and total land in acres.
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='farmer_profile'
    )
    phone = models.CharField(
        max_length=15, 
        unique=True, 
        db_index=True,
        help_text="Farmer contact phone number (used as unique login credential)"
    )
    location = models.CharField(
        max_length=255, 
        help_text="Village, Taluka, or District"
    )
    total_acres = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        default=0.0,
        help_text="Total land holding in acres"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Farmer Profile"
        verbose_name_plural = "Farmer Profiles"
        ordering = ['-created_at']

    def __str__(self):
        full_name = self.user.get_full_name()
        display_name = full_name if full_name else self.user.username
        return f"{display_name} - {self.location} ({self.phone})"


class Field(models.Model):
    """
    Agricultural Land Parcels / Plots owned or managed by a farmer.
    """
    SOIL_TYPE_CHOICES = [
        ('Black', 'Black Soil'),
        ('Red', 'Red Soil'),
        ('Loamy', 'Loamy Soil'),
        ('Alluvial', 'Alluvial Soil'),
        ('Clayey', 'Clayey Soil'),
        ('Sandy', 'Sandy Soil'),
        ('Other', 'Other'),
    ]

    farmer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='fields',
        help_text="Farmer who owns/manages this field"
    )
    field_name = models.CharField(
        max_length=100, 
        help_text="Human-readable field name (e.g., North Plot, Gat No. 42)"
    )
    land_area = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        help_text="Total field size in acres"
    )
    soil_type = models.CharField(
        max_length=50, 
        choices=SOIL_TYPE_CHOICES,
        default='Loamy',
        help_text="Soil classification"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fields'
        verbose_name = 'Field'
        verbose_name_plural = 'Fields'
        ordering = ['field_name']

    def __str__(self):
        return f"{self.field_name} ({self.land_area} acres - {self.farmer.username})"


class Crop(models.Model):
    """
    Crop cultivation cycle sown in a specific field parcel by a farmer.
    """
    SEASON_CHOICES = [
        ('Kharif', 'Kharif (Monsoon)'),
        ('Rabi', 'Rabi (Winter)'),
        ('Zaid', 'Zaid (Summer)'),
        ('Annual', 'Annual / Perennial'),
    ]

    STATUS_CHOICES = [
        ('Sown', 'Sown'),
        ('Growing', 'Growing'),
        ('Harvested', 'Harvested'),
        ('Closed', 'Closed'),
    ]

    farmer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='crops',
        help_text="Farmer cultivating this crop"
    )
    field = models.ForeignKey(
        Field, 
        on_delete=models.CASCADE, 
        related_name='crops',
        help_text="Land parcel where crop is cultivated"
    )
    crop_name = models.CharField(
        max_length=100, 
        help_text="Crop name (e.g., Sugarcane, Soybean, Wheat, Cotton)"
    )
    variety = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Seed variety or hybrid code (e.g., JS 335, Co 86032)"
    )
    season = models.CharField(
        max_length=30, 
        choices=SEASON_CHOICES,
        default='Kharif'
    )
    sowing_date = models.DateField(help_text="Date when sowing/planting occurred")
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='Sown',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crops'
        verbose_name = 'Crop'
        verbose_name_plural = 'Crops'
        ordering = ['-sowing_date']

    def __str__(self):
        return f"{self.crop_name} ({self.season} - {self.status}) - {self.farmer.username}"


class Expense(models.Model):
    """
    Itemized cultivation expenditure incurred during a crop lifecycle.
    """
    CATEGORY_CHOICES = [
        ('Seeds', 'Seeds / Seedlings'),
        ('Labour', 'Labour Wages'),
        ('Fertilizers', 'Fertilizers'),
        ('Pesticides', 'Pesticides / Insecticides'),
        ('Irrigation', 'Irrigation / Electricity / Water'),
        ('Machinery', 'Machinery / Tractor Rent / Fuel'),
        ('Transportation', 'Transportation / Logistics'),
        ('Other', 'Other Miscellaneous'),
    ]

    crop = models.ForeignKey(
        Crop, 
        on_delete=models.CASCADE, 
        related_name='expenses',
        help_text="Associated crop cultivation cycle"
    )
    expense_category = models.CharField(
        max_length=30, 
        choices=CATEGORY_CHOICES,
        db_index=True
    )
    description = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        help_text="Specific details (e.g., 5 laborers for weeding)"
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Expense cost in INR (₹)"
    )
    expense_date = models.DateField(help_text="Date expense was incurred")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.crop.crop_name} - {self.expense_category}: ₹{self.amount}"


class Harvest(models.Model):
    """
    Produce output yield records upon crop harvest.
    """
    UNIT_CHOICES = [
        ('Quintals', 'Quintals'),
        ('Tonnes', 'Tonnes'),
        ('Bags', 'Bags'),
        ('Kgs', 'Kilograms (Kg)'),
    ]

    crop = models.ForeignKey(
        Crop, 
        on_delete=models.CASCADE, 
        related_name='harvests',
        help_text="Harvested crop"
    )
    harvest_date = models.DateField(help_text="Date harvest was completed")
    quantity_harvested = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Total produce yield harvested"
    )
    unit = models.CharField(
        max_length=20, 
        choices=UNIT_CHOICES, 
        default='Quintals'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'harvests'
        verbose_name = 'Harvest'
        verbose_name_plural = 'Harvests'
        ordering = ['-harvest_date']

    def __str__(self):
        return f"{self.crop.crop_name} Harvest: {self.quantity_harvested} {self.unit} ({self.harvest_date})"


class Sale(models.Model):
    """
    Market trade transactions for produce sold to traders or APMC Mandis.
    """
    harvest = models.ForeignKey(
        Harvest, 
        on_delete=models.CASCADE, 
        related_name='sales',
        help_text="Harvest batch being sold"
    )
    quantity_sold = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Quantity sold in harvest units"
    )
    selling_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Selling price per unit in INR (₹)"
    )
    total_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        help_text="Total realized amount (quantity_sold * selling_price)"
    )
    sale_date = models.DateField(help_text="Date transaction took place")
    buyer_name = models.CharField(
        max_length=120, 
        help_text="Buyer, trader, or APMC Mandi merchant"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sales'
        verbose_name = 'Sale'
        verbose_name_plural = 'Sales'
        ordering = ['-sale_date']

    def save(self, *args, **kwargs):
        if self.quantity_sold is not None and self.selling_price is not None:
            self.total_amount = round(self.quantity_sold * self.selling_price, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sale: {self.quantity_sold} units @ ₹{self.selling_price} to {self.buyer_name} (₹{self.total_amount})"


class FinancialAnalysis(models.Model):
    """
    Consolidated financial metrics and performance returns per crop cycle.
    """
    crop = models.OneToOneField(
        Crop, 
        on_delete=models.CASCADE, 
        related_name='financial_analysis',
        help_text="Crop cycle under financial analysis"
    )
    total_cost = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        help_text="Total cultivation cost (sum of expenses)"
    )
    total_revenue = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        help_text="Total sales revenue (sum of sales)"
    )
    profit_loss = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        help_text="Net profit or loss (total_revenue - total_cost)"
    )
    cost_per_acre = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        help_text="Cost per acre (total_cost / land_area)"
    )
    profit_per_acre = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        help_text="Profit per acre (profit_loss / land_area)"
    )
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'financial_analysis'
        verbose_name = 'Financial Analysis'
        verbose_name_plural = 'Financial Analyses'

    def __str__(self):
        return f"Financials for {self.crop.crop_name}: Rev ₹{self.total_revenue} | Cost ₹{self.total_cost} | P/L ₹{self.profit_loss}"


class CropRecommendation(models.Model):
    """
    AI Crop Recommendation inputs and model advisory outputs.
    """
    farmer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='crop_recommendations',
        help_text="Farmer requesting recommendation"
    )
    soil_type = models.CharField(max_length=50)
    season = models.CharField(max_length=30)
    weather_conditions = models.CharField(
        max_length=150, 
        help_text="Rainfall, temperature, humidity conditions"
    )
    irrigation_type = models.CharField(
        max_length=50, 
        help_text="Irrigation type (e.g., Canal, Drip, Sprinkler, Rainfed)"
    )
    recommended_crop = models.CharField(
        max_length=100, 
        help_text="Crop suggested by AI / ML model"
    )
    recommendation_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'crop_recommendations'
        verbose_name = 'Crop Recommendation'
        verbose_name_plural = 'Crop Recommendations'
        ordering = ['-recommendation_date']

    def __str__(self):
        return f"Rec: {self.recommended_crop} ({self.season}) for {self.farmer.username}"


class YieldPrediction(models.Model):
    """
    AI Yield Prediction inputs and expected harvest estimates.
    """
    crop = models.ForeignKey(
        Crop, 
        on_delete=models.CASCADE, 
        related_name='yield_predictions',
        help_text="Target crop"
    )
    land_area = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        help_text="Cultivated area in acres"
    )
    season = models.CharField(max_length=30)
    soil_type = models.CharField(max_length=50)
    fertilizer_use = models.CharField(max_length=100, blank=True, null=True)
    rainfall = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text="Rainfall in mm"
    )
    predicted_yield = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Predicted yield in Quintals/Tonnes"
    )
    prediction_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'yield_predictions'
        verbose_name = 'Yield Prediction'
        verbose_name_plural = 'Yield Predictions'
        ordering = ['-prediction_date']

    def __str__(self):
        return f"Yield Pred: {self.crop.crop_name} -> {self.predicted_yield} units"


class ProfitPrediction(models.Model):
    """
    AI Profit Prediction inputs and expected financial realization.
    """
    crop = models.ForeignKey(
        Crop, 
        on_delete=models.CASCADE, 
        related_name='profit_predictions',
        help_text="Target crop"
    )
    estimated_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Projected cost in INR (₹)"
    )
    predicted_yield = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Expected yield output"
    )
    estimated_selling_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Expected market APMC price per unit (₹)"
    )
    predicted_profit = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        help_text="Estimated net profit = (yield * price) - cost"
    )
    prediction_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'profit_predictions'
        verbose_name = 'Profit Prediction'
        verbose_name_plural = 'Profit Predictions'
        ordering = ['-prediction_date']

    def save(self, *args, **kwargs):
        if self.predicted_profit is None and self.predicted_yield is not None and self.estimated_selling_price is not None and self.estimated_cost is not None:
            self.predicted_profit = round((self.predicted_yield * self.estimated_selling_price) - self.estimated_cost, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Profit Pred: {self.crop.crop_name} -> Expected ₹{self.predicted_profit}"


class SystemAnnouncement(models.Model):
    """
    Broadcast announcements and advisories from system administrators to all farmers.
    """
    PRIORITY_CHOICES = [
        ('info', 'Information'),
        ('warning', 'Advisory / Weather Warning'),
        ('danger', 'Critical Alert / Pest Outbreak'),
        ('success', 'Subsidy / Scheme Notice'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='info')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements'
    )

    class Meta:
        db_table = 'system_announcements'
        verbose_name = 'System Announcement'
        verbose_name_plural = 'System Announcements'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority.upper()}] {self.title}"
