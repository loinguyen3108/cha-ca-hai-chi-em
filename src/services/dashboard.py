from functools import cached_property

from datetime import datetime
from sqlalchemy import func, and_
from src.models import Order, OrderLine, Product, Importer, ImportLine

class DashboardService:

    @cached_property
    def order_service(self):
        from src.services.order import OrderService
        return OrderService()

    @cached_property
    def importer_service(self):
        from src.services.importer import ImporterService
        return ImporterService()

    def get_metrics(self, start_date: str, end_date: str):
        """
        Get dashboard metrics for the specified date range
        """
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            end = end.replace(hour=23, minute=59, second=59)

            # Get total sales
            sales_metrics = self.order_service.get_sales_metrics(start, end)
            
            # Get total imports
            import_metrics = self.importer_service.get_import_metrics(start, end)

            return {
                "success": True,
                "metrics": {
                    "sales": sales_metrics,
                    "imports": import_metrics
                }
            }
        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }
            